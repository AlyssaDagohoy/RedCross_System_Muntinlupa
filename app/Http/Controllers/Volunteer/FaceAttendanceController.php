<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Activity;
use App\Notifications\AttendanceRecorded;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class FaceAttendanceController extends Controller
{
    /**
     * Max face distance that still counts as "the same person".
     * Lower = stricter. 0.6 (the library default) is loose enough that different
     * people can pass. 0.45 is a safer start; raise to 0.5 if you get rejected too often.
     */
    private const FACE_MATCH_THRESHOLD = 0.45;

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

        if ($error = $this->faceError($user, $request->face_descriptor)) {
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

        Attendance::create([
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
        ]);

        $user = auth()->user();
        $activity = Activity::findOrFail($request->activity_id);

        $now = Carbon::now();

        // Time Out stays open until the grace period after the end.
        if ($now->gt($activity->timeOutClosesAt())) {
            return back()->withErrors(['face' => 'Time out is closed. Please ask the admin to review your attendance.']);
        }

        $status = $activity->timeOutStatusAt($now);

        if ($error = $this->faceError($user, $request->face_descriptor)) {
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

        $record->update([
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
    /** Returns an error message, or null when the face matches the registered one. */
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