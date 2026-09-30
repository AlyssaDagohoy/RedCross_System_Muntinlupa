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
        ]);

        $user = auth()->user();

        if ($error = $this->faceError($user, $request->face_descriptor)) {
            return back()->withErrors(['face' => $error]);
        }

        // The activity must be assigned to this volunteer and scheduled for today.
        $activity = $user->activities()
            ->where('activities.id', $request->activity_id)
            ->whereDate('activities.date', today())
            ->where('activities.status', '!=', 'cancelled')
            ->first();

        if (!$activity) {
            return back()->withErrors(['face' => 'This activity is not assigned to you or is not scheduled for today.']);
        }

        // Time In window: opens 30 minutes before the start, closes when the activity ends.
        $now = Carbon::now();

        if ($now->lt($activity->timeInOpensAt())) {
            return back()->withErrors(['face' => 'Time in is not open yet. You can time in starting ' . $activity->timeInOpensAt()->format('g:i A') . '.']);
        }

        if ($now->gt($activity->endsAt())) {
            return back()->withErrors(['face' => 'This activity has already ended, so time in is closed.']);
        }

        if ($error = $this->locationError($activity, $request->latitude, $request->longitude)) {
            return back()->withErrors(['face' => $error]);
        }

        $existing = Attendance::where('user_id', $user->id)
            ->where('activity_id', $activity->id)
            ->whereDate('date', today())
            ->first();

        if ($existing) {
            return back()->withErrors(['face' => 'Already timed in for this activity today.']);
        }

        Attendance::create([
            'user_id'           => $user->id,
            'activity_id'       => $activity->id,
            'date'              => today(),
            'time_in'           => Carbon::now(),
            'latitude'          => $request->latitude,
            'longitude'         => $request->longitude,
            'attendance_method' => 'face',
            'status'            => 'present',
        ]);

        // The attendance is already saved at this point, so a notification problem
        // must not turn a successful Time In into a 500 error.
        $this->notifySafely($user, new AttendanceRecorded('time_in', $activity->name));

        return back()->with('message', 'Time in recorded successfully!');
    }

    public function timeOut(Request $request)
    {
        $request->validate([
            'activity_id'       => 'required|exists:activities,id',
            'face_descriptor'   => 'required|array',
            'face_descriptor.*' => 'numeric',
            'latitude'          => 'required|numeric',
            'longitude'         => 'required|numeric',
        ]);

        $user = auth()->user();

        if ($error = $this->faceError($user, $request->face_descriptor)) {
            return back()->withErrors(['face' => $error]);
        }

        $activity = Activity::findOrFail($request->activity_id);

        if ($error = $this->locationError($activity, $request->latitude, $request->longitude)) {
            return back()->withErrors(['face' => $error]);
        }

        $record = Attendance::where('user_id', $user->id)
            ->where('activity_id', $request->activity_id)
            ->whereDate('date', today())
            ->first();

        if (!$record || !$record->time_in || $record->time_out) {
            return back()->withErrors(['face' => 'No valid time-in found for this activity.']);
        }

        $timeOut = Carbon::now();
        $hours = round($record->time_in->diffInMinutes($timeOut) / 60, 2);

        $leftEarly = false;
        if ($activity->end_time) {
            $scheduledEnd = Carbon::parse($activity->end_time)->setDateTime(
                $timeOut->year, $timeOut->month, $timeOut->day,
                Carbon::parse($activity->end_time)->hour,
                Carbon::parse($activity->end_time)->minute
            );
            $leftEarly = $timeOut->lt($scheduledEnd);
        }

        $record->update([
            'time_out'       => $timeOut,
            'hours_rendered' => $hours,
            'left_early'     => $leftEarly,
        ]);

        // Same protection as Time In: the record is saved, so don't fail the request.
        $this->notifySafely($user, new AttendanceRecorded('time_out', $activity->name, $hours, $leftEarly));

        return back()->with('message', $leftEarly
            ? "Time out recorded (left early). Hours rendered: {$hours}"
            : "Time out recorded! Hours rendered: {$hours}"
        );
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