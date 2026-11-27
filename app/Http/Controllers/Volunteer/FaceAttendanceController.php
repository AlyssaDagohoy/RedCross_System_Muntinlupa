<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Activity;
use App\Notifications\AttendanceRecorded;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Services\EmailCodeService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;

class FaceAttendanceController extends Controller
{
    /**
     * Max face distance that still counts as "the same person".
     * Lower = stricter. 0.6 (the library default) is loose enough that different
     * people can pass. 0.45 is a safer start; raise to 0.5 if you get rejected too often.
     */
    private const FACE_MATCH_THRESHOLD = 0.45;

    private const LIVENESS_MIN_SECONDS = 1;   // too fast = scripted, not a person
    private const LIVENESS_MAX_SECONDS = 120; // challenge expires

    /** GET: hands the browser a random, single-use liveness challenge. */
    public function challenge(Request $request)
    {
        $challenge = collect(['blink', 'left', 'right'])->random();
        $token     = Str::random(40);

        session(['face_liveness' => [
            'token'     => $token,
            'challenge' => $challenge,
            'issued_at' => now()->timestamp,
        ]]);

        return response()->json(['token' => $token, 'challenge' => $challenge]);
    }

    /** Returns an error message, or null when the liveness challenge is valid. Does not consume it. */
    private function livenessError(Request $request): ?string
    {
        $data = session('face_liveness');

        if (!$data
            || !hash_equals((string) $data['token'], (string) $request->input('liveness_token'))
            || $data['challenge'] !== $request->input('liveness_challenge')) {
            return 'Liveness check failed or expired. Please try again.';
        }

        $age = now()->timestamp - (int) $data['issued_at'];

        if ($age < self::LIVENESS_MIN_SECONDS) {
            return 'Liveness check was too fast. Please try again.';
        }
        if ($age > self::LIVENESS_MAX_SECONDS) {
            return 'Liveness check expired. Please try again.';
        }

        return null;
    }

    /** One challenge = one attendance record. Called right before the record is saved. */
    private function consumeLiveness(): void
    {
        session()->forget('face_liveness');
    }

    public function registerFace(Request $request)
    {
        $request->validate([
            'face_descriptor' => 'required|array',
        ]);

        $user = auth()->user();
        $user->update([
            'face_descriptor' => json_encode($request->face_descriptor),
            'face_status' => 'approved',
        ]);

        return back()->with('message', 'Face registered successfully!');
    }

    public function timeIn(Request $request)
    {
        $request->validate([
            'activity_id'       => 'required|exists:activities,id',
            'face_descriptor'   => 'required|array',
            'face_descriptor.*' => 'numeric',
            'latitude'          => 'required|numeric',
            'longitude'         => 'required|numeric',
            'confirm_early'     => 'sometimes|boolean',
            'confirm_late'      => 'sometimes|boolean',
            'liveness_token'     => 'required|string',
            'liveness_challenge' => 'required|in:blink,left,right',
            'fallback_code'      => 'sometimes|nullable|digits:6',
            'fallback_photo'     => 'sometimes|nullable|string|max:900000',
        ]);

        $user = auth()->user();

        // The activity must be assigned to this volunteer and scheduled for today.
        $activity = $user->activities()
            ->where('activities.id', $request->activity_id)
            ->whereDate('activities.date', '>=', today()->subDay())
            ->whereDate('activities.date', '<=', today())
            ->where('activities.status', '!=', 'cancelled')
            ->first();

        if (!$activity) {
            return back()->withErrors(['face' => 'This activity is not assigned to you or is not scheduled for today.']);
        }

        $now = Carbon::now();

        // Time In stays open until the activity ends.
        if ($now->gt($activity->timeInClosesAt())) {
            return back()->withErrors(['face' => 'Time in is closed. The activity has ended.']);
        }

        // Hard limit: Time In is not open yet.
        if ($now->lt($activity->timeInOpensAt())) {
            return back()->withErrors(['face' => 'Time in opens at ' . $activity->timeInOpensAt()->format('g:i A') . '.']);
        }

        $status = $activity->timeInStatusAt($now);

        if ($error = $this->livenessError($request)) {
            return back()->withErrors(['face' => $error]);
        }

        if ($error = $this->faceOrFallbackError($user, $request, $activity)) {
            return back()->withErrors(['face' => $error]);
        }

        if ($error = $this->locationError($activity, $request->latitude, $request->longitude)) {
            return back()->withErrors(['face' => $error]);
        }

        $existing = Attendance::where('user_id', $user->id)
            ->where('activity_id', $activity->id)
            ->whereDate('date', Carbon::parse($activity->date)->toDateString())
            ->first();

        if ($existing) {
            return back()->withErrors(['face' => 'Already timed in for this activity today.']);
        }

        $this->consumeLiveness();
        Attendance::create($this->fallbackFields($request, $user, null) + [
            'user_id'           => $user->id,
            'activity_id'       => $activity->id,
            'date'              => Carbon::parse($activity->date)->toDateString(),
            'time_in'           => $now,
            'time_in_status'    => $status,
            'latitude'          => $request->latitude,
            'longitude'         => $request->longitude,
            'attendance_method' => 'face',
            'status'            => 'present',
        ]);

        // The attendance is already saved at this point, so a notification problem
        // must not turn a successful Time In into a 500 error.
        $this->notifyAttendance($user, 'time_in', $activity, $now, null, $status);

        return back()->with('message', match ($status) {
            'early' => 'Time in recorded (early).',
            'late'  => 'Time in recorded (late).',
            default => 'Time in recorded successfully!',
        });
    }

    public function timeOut(Request $request)
    {
        $request->validate([
            'activity_id'       => 'required|exists:activities,id',
            'face_descriptor'   => 'required|array',
            'face_descriptor.*' => 'numeric',
            'latitude'          => 'required|numeric',
            'longitude'         => 'required|numeric',
            'confirm_early'     => 'sometimes|boolean',
            'confirm_late'      => 'sometimes|boolean',
            'liveness_token'     => 'required|string',
            'liveness_challenge' => 'required|in:blink,left,right',
            'fallback_code'      => 'sometimes|nullable|digits:6',
            'fallback_photo'     => 'sometimes|nullable|string|max:900000',
        ]);

        $user = auth()->user();
        $activity = Activity::findOrFail($request->activity_id);

        $now = Carbon::now();

        // Time Out stays open until the grace period after the end.
        if ($now->gt($activity->timeOutClosesAt())) {
            return back()->withErrors(['face' => 'Time out is closed. Please ask the admin to review your attendance.']);
        }

        $status = $activity->timeOutStatusAt($now);

        if ($error = $this->livenessError($request)) {
            return back()->withErrors(['face' => $error]);
        }

        if ($error = $this->faceOrFallbackError($user, $request, $activity)) {
            return back()->withErrors(['face' => $error]);
        }

        // Time Out must be inside the activity location too.
        if ($error = $this->locationError($activity, $request->latitude, $request->longitude)) {
            return back()->withErrors(['face' => $error]);
        }

        // Use the activity's date (not today's date) so a Time Out after midnight still finds the record.
        $record = Attendance::where('user_id', $user->id)
            ->where('activity_id', $activity->id)
            ->whereDate('date', Carbon::parse($activity->date)->toDateString())
            ->first();

        if (!$record || !$record->time_in || $record->time_out) {
            return back()->withErrors(['face' => 'No valid time-in found for this activity.']);
        }

        $start = $activity->startsAt();
        $end   = $activity->endsAt();

        // Hours run from the official start (or the actual Time In, if later)
        // to the actual Time Out, but never past the official end.
        $countedFrom  = $record->time_in->gt($start) ? $record->time_in : $start;
        $countedUntil = $now->gt($end) ? $end : $now;
        $minutes      = max(0, $countedFrom->diffInMinutes($countedUntil, false));
        $hours        = round($minutes / 60, 2);

        $this->consumeLiveness();
        $record->update($this->fallbackFields($request, $user, $record) + [
            'time_out'           => $now,
            'time_out_status'    => $status,
            'time_out_latitude'  => $request->latitude,
            'time_out_longitude' => $request->longitude,
            'hours_rendered'     => $hours,
            'left_early'         => $status === 'early',
            'late_time_out'      => $status === 'late',
        ]);

        // Same protection as Time In: the record is saved, so don't fail the request.
        $this->notifyAttendance($user, 'time_out', $activity, $now, $hours, $status);

        // Fallback (email code + selfie) needs an admin to check the selfie first.
        if ($record->attendance_method === 'face_fallback') {
            $record->update(['status' => 'needs_review']);

            return back()->with('message', "Time out recorded. Hours rendered: {$hours}. Because you used the email code, your attendance is waiting for admin review.");
        }

        return back()->with('message', match ($status) {
            'late'  => "Time out recorded (late). Hours rendered: {$hours}",
            'early' => "Time out recorded (left early). Hours rendered: {$hours}",
            default => "Time out recorded! Hours rendered: {$hours}",
        });
    }

    /** "1 hour 5 minutes", "12 minutes", etc. Used in the modal messages. */
    private function humanDuration(Carbon $a, Carbon $b): string
    {
        $mins = (int) floor(abs($a->diffInMinutes($b, false)));

        if ($mins < 1) {
            return 'less than a minute';
        }

        $h = intdiv($mins, 60);
        $m = $mins % 60;
        $parts = [];

        if ($h > 0) {
            $parts[] = $h . ' hour' . ($h > 1 ? 's' : '');
        }
        if ($m > 0) {
            $parts[] = $m . ' minute' . ($m > 1 ? 's' : '');
        }

        return implode(' ', $parts);
    }

    /**
     * Sends a notification without letting a failure break the request.
     * If it fails, the real error is written to storage/logs/laravel.log
     * under "AttendanceRecorded notification failed".
     */
    private function notifySafely($user, $notification): void
    {
        try {
            $user->notify($notification);
        } catch (\Throwable $e) {
            Log::error('AttendanceRecorded notification failed: ' . $e->getMessage(), [
                'user_id'   => $user->id,
                'exception' => $e,
            ]);
        }
    }

    /** Bell notification for Time In / Time Out. Never breaks the request. */
    private function notifyAttendance($user, string $type, $activity, Carbon $when, $hours = null, $status = null): void
    {
        try {
            $time = $when->format('g:i A');

            if ($type === 'time_in') {
                $label   = match ($status) { 'early' => ' (early)', 'late' => ' (late)', default => '' };
                $title   = 'Timed in: ' . $activity->name;
                $message = "You timed in at {$time}{$label}. Remember to time out when you're done.";
            } else {
                $title   = 'Timed out: ' . $activity->name;
                $message = "You timed out at {$time}. {$hours} " . ((float) $hours === 1.0 ? 'hour' : 'hours') . ' recorded.';
                if ($status === 'early') {
                    $message .= ' You left before the activity ended.';
                } elseif ($status === 'late') {
                    $message .= ' You timed out after the activity ended.';
                }
            }

            $url = \Illuminate\Support\Facades\Route::has('volunteer.attendance')
                ? route('volunteer.attendance')
                : route('volunteer.records');

            \App\Models\Notification::create([
                'user_id'      => $user->id,
                'category'     => 'attendance',
                'title'        => $title,
                'message'      => $message,
                'action_label' => 'View attendance',
                'action_url'   => $url,
            ]);
        } catch (\Throwable $e) {
            Log::error('Attendance bell notification failed: ' . $e->getMessage(), ['user_id' => $user->id]);
        }
    }
        private const FALLBACK_MATCH_THRESHOLD = 0.65; // only rejects clearly different people
    private const FALLBACK_AFTER_FAILS     = 3;
    private const FALLBACK_MAX_PER_DAY     = 3;

    private function failKey($user, $activityId, string $mode): string
    {
        return 'face-fails:' . $user->id . ':' . $activityId . ':' . $mode;
    }

    /** POST: the browser reports a scan that got stuck (dark camera, no face, liveness not finished). */
    public function scanProblem(Request $request)
    {
        $request->validate([
            'activity_id' => 'required|exists:activities,id',
            'mode'        => 'required|in:in,out',
        ]);

        $user = auth()->user();
        if (!$user->activities()->where('activities.id', $request->activity_id)->exists()) {
            return response()->json(['message' => 'This activity is not assigned to you.'], 422);
        }

        $key = $this->failKey($user, $request->activity_id, $request->mode);

        // at most one report every 8 seconds
        if (!Cache::add($key . ':lock', 1, now()->addSeconds(8))) {
            return response()->json(['count' => (int) Cache::get($key, 0)]);
        }

        $count = (int) Cache::get($key, 0) + 1;
        Cache::put($key, $count, now()->addMinutes(30));

        return response()->json(['count' => $count]);
    }
    /** POST: emails a 6-digit code, only after 3 failed face scans (counted on the server). */
    public function fallbackCode(Request $request, EmailCodeService $codes)
    {
        $request->validate([
            'activity_id' => 'required|exists:activities,id',
            'mode'        => 'required|in:in,out',
        ]);

        $user = auth()->user();

        $assigned = $user->activities()->where('activities.id', $request->activity_id)->exists();
        if (!$assigned) {
            return response()->json(['message' => 'This activity is not assigned to you.'], 422);
        }

        if ((int) Cache::get($this->failKey($user, $request->activity_id, $request->mode), 0) < self::FALLBACK_AFTER_FAILS) {
            return response()->json(['message' => 'Verify another way is only available after 3 failed face scans.'], 422);
        }

        $limiterKey = 'fallback-send:' . $user->id;
        if (RateLimiter::tooManyAttempts($limiterKey, 3)) {
            return response()->json(['message' => 'Too many code requests. Please wait a few minutes.'], 429);
        }
        RateLimiter::hit($limiterKey, 900);

        if (!\Illuminate\Support\Facades\Hash::check((string) $request->input('password'), (string) $user->password)) {
            return response()->json(['message' => 'Incorrect password.'], 422);
        }

        $code = $codes->issue('attendance-fallback', $user->id . '|' . $request->activity_id . '|' . $request->mode, 5);

        try {
            Mail::raw(
                "Your Scan2Serve attendance code is {$code}\n\nIt expires in 5 minutes. If you did not ask for this, ignore this email and tell your coordinator.",
                function ($m) use ($user) {
                    $m->to($user->email)->subject('Your Scan2Serve attendance code');
                }
            );
        } catch (\Throwable $e) {
            Log::error('Attendance fallback email failed: ' . $e->getMessage(), ['user_id' => $user->id]);
            return response()->json(['message' => 'We could not send the email right now. Please try again.'], 500);
        }

        return response()->json(['sent' => true]);
    }

    /** Normal face check, or (when a fallback code is sent) the fallback checks. */
    private function faceOrFallbackError($user, Request $request, Activity $activity): ?string
    {
        $mode    = $request->routeIs('*timein') ? 'in' : 'out';
        $failKey = $this->failKey($user, $activity->id, $mode);

        if ($request->filled('fallback_code')) {
            if ((int) Cache::get($failKey, 0) < self::FALLBACK_AFTER_FAILS) {
                return 'Verify another way is only available after 3 failed face scans.';
            }
            if ($this->decodeFallbackPhoto($request) === null) {
                return 'A clear selfie is required for this check. Please try again.';
            }

            $usedToday = Attendance::where('user_id', $user->id)
                ->where('attendance_method', 'face_fallback')
                ->whereDate('updated_at', today())
                ->count();
            if ($usedToday >= self::FALLBACK_MAX_PER_DAY) {
                return 'You reached the daily limit for this check. Please ask your coordinator.';
            }

            $distance = $this->faceDistance($user, $request->face_descriptor);
            if ($distance === null) {
                return 'Face data is invalid. Please try again.';
            }
            // Face match is not required in the fallback. The distance is saved for the admin to review.

            $identifier = $user->id . '|' . $activity->id . '|' . $mode;
            if (!app(EmailCodeService::class)->verify('attendance-fallback', $identifier, (string) $request->fallback_code)) {
                return 'The code is invalid or has expired.';
            }

            Log::info('Fallback verification passed', ['user_id' => $user->id, 'distance' => round($distance, 3)]);
            $request->attributes->set('fallback_distance', round($distance, 3));
            return null;
        }

        $error = $this->faceError($user, $request->face_descriptor);
        if ($error) {
            Cache::put($failKey, (int) Cache::get($failKey, 0) + 1, now()->addMinutes(30));
        }
        return $error;
    }

    private function faceDistance($user, array $incoming): ?float
    {
        if (!$user->face_descriptor) {
            return null;
        }
        $stored = json_decode($user->face_descriptor, true);
        if (!is_array($stored) || count($stored) !== count($incoming)) {
            return null;
        }
        return $this->euclideanDistance($stored, $incoming);
    }

    private function decodeFallbackPhoto(Request $request): ?array
    {
        $data = (string) $request->input('fallback_photo');
        if (!preg_match('#^data:image/(jpeg|png);base64,#', $data, $m)) {
            return null;
        }
        $bin = base64_decode(substr($data, strpos($data, ',') + 1), true);
        if ($bin === false || strlen($bin) > 700000 || @getimagesizefromstring($bin) === false) {
            return null;
        }
        return ['bin' => $bin, 'ext' => $m[1] === 'png' ? 'png' : 'jpg'];
    }

    private function saveFallbackPhoto(Request $request, $user): ?string
    {
        $photo = $this->decodeFallbackPhoto($request);
        if (!$photo) {
            return null;
        }
        $path = 'fallback/' . $user->id . '-' . now()->format('YmdHisv') . '.' . $photo['ext'];
        Storage::disk('local')->put($path, $photo['bin']);
        return $path;
    }

    /** Extra columns saved when the fallback was used. Empty for a normal scan. */
    private function fallbackFields(Request $request, $user, $record): array
    {
        $distance = $request->attributes->get('fallback_distance');
        if ($distance === null) {
            return [];
        }
        return [
            'attendance_method'   => 'face_fallback',
            'fallback_distance'   => $distance,
            'fallback_photo_path' => $this->saveFallbackPhoto($request, $user) ?: ($record->fallback_photo_path ?? null),
        ];
    }

    /** Returns an error message, or null when the face matches the registered one. */
    /** Early check: does this face match the registered face? Used at the start of a normal scan. */
    public function precheck(\Illuminate\Http\Request $request)
    {
        $request->validate(['face_descriptor' => 'required|array']);

        $error = $this->faceError($request->user(), $request->input('face_descriptor'));
        if ($error) {
            return response()->json(['ok' => false, 'message' => $error], 422);
        }

        return response()->json(['ok' => true]);
    }

    private function faceError($user, array $incoming): ?string
    {
        if (!$user->face_descriptor) {
            return 'Face not registered. Please register your face first.';
        }

        $stored = json_decode($user->face_descriptor, true);

        if (!is_array($stored) || count($stored) !== count($incoming)) {
            return 'Face data is invalid. Please try again.';
        }

        $distance = $this->euclideanDistance($stored, $incoming);

        // Logged so you can see real numbers: your own face vs. someone else's.
        Log::info('Face match distance', [
            'user_id'   => $user->id,
            'distance'  => round($distance, 3),
            'threshold' => self::FACE_MATCH_THRESHOLD,
        ]);

        if ($distance > self::FACE_MATCH_THRESHOLD) {
            return 'Face not recognized. Please try again.';
        }

        return null;
    }

    /** Returns an error message, or null when the volunteer is inside the activity's allowed radius. */
    private function locationError(Activity $activity, $latitude, $longitude): ?string
    {
        $dist = $this->haversineDistance(
            $latitude, $longitude,
            $activity->latitude, $activity->longitude
        );

        if ($dist > $activity->radius_meters) {
            return "You are too far from the activity location. You are {$dist}m away. Allowed: {$activity->radius_meters}m.";
        }

        return null;
    }

    private function euclideanDistance(array $a, array $b): float
    {
        $sum = 0;
        foreach ($a as $i => $val) {
            $sum += ($val - ($b[$i] ?? 0)) ** 2;
        }
        return sqrt($sum);
    }

    private function haversineDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $R = 6371000;
        $phi1 = deg2rad($lat1);
        $phi2 = deg2rad($lat2);
        $dphi = deg2rad($lat2 - $lat1);
        $dlambda = deg2rad($lon2 - $lon1);
        $a = sin($dphi/2)**2 + cos($phi1)*cos($phi2)*sin($dlambda/2)**2;
        return round($R * 2 * atan2(sqrt($a), sqrt(1-$a)));
    }
}