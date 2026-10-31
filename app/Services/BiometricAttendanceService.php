<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\BiometricDevice;
use App\Models\BiometricScan;
use App\Models\User;
use App\Notifications\AttendanceRecorded;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class BiometricAttendanceService
{
    /** Value of activities.type for branch activities. */
    private const BRANCH_TYPE = 'branch';

    /** A second scan by the same person within this many seconds is ignored. */
    private const DUPLICATE_SECONDS = 60;

    /**
     * Handles one scan from the device (or the simulator).
     * The raw scan is always saved first, then its result is filled in.
     */
    public function handleScan(string $biometricId, ?Carbon $at = null, ?string $deviceSerial = null, array $raw = []): BiometricScan
    {
        $at = $at ?? Carbon::now();

        if ($deviceSerial) {
            BiometricDevice::updateOrCreate(
                ['serial_number' => $deviceSerial],
                ['last_seen_at' => Carbon::now()]
            );
        }

        $scan = BiometricScan::create([
            'device_serial' => $deviceSerial,
            'biometric_id'  => $biometricId,
            'scanned_at'    => $at,
            'result'        => 'pending',
            'raw'           => $raw ?: null,
        ]);

        $user = User::where('biometric_id', $biometricId)->first();
        if (!$user) {
            return $this->finish($scan, 'unknown_id');
        }
        $scan->user_id = $user->id;

        $isDuplicate = BiometricScan::where('biometric_id', $biometricId)
            ->where('id', '!=', $scan->id)
            ->whereIn('result', ['time_in', 'time_out'])
            ->whereBetween('scanned_at', [
                $at->copy()->subSeconds(self::DUPLICATE_SECONDS),
                $at->copy()->addSeconds(self::DUPLICATE_SECONDS),
            ])
            ->exists();

        if ($isDuplicate) {
            return $this->finish($scan, 'duplicate');
        }

        $activities = $user->activities()
            ->where('activities.type', self::BRANCH_TYPE)
            ->where('activities.status', '!=', 'cancelled')
            ->whereDate('activities.date', '>=', $at->copy()->subDay()->toDateString())
            ->whereDate('activities.date', '<=', $at->toDateString())
            ->get()
            ->filter(fn ($a) => $at->gte($a->timeInOpensAt()) && $at->lte($a->timeOutClosesAt()));

        $openActivity = null;
        $openRecord = null;
        $freeActivities = [];
        $finished = false;

        foreach ($activities as $activity) {
            $record = Attendance::where('user_id', $user->id)
                ->where('activity_id', $activity->id)
                ->whereDate('date', Carbon::parse($activity->date)->toDateString())
                ->first();

            if ($record && $record->time_in && !$record->time_out) {
                $openActivity = $activity;
                $openRecord = $record;
                break;
            }

            if ($record && $record->time_out) {
                $finished = true;
                continue;
            }

            if (!$record && $at->lte($activity->timeInClosesAt())) {
                $freeActivities[] = $activity;
            }
        }

        if ($openRecord) {
            return $this->recordTimeOut($scan, $user, $openActivity, $openRecord, $at);
        }

        if (!empty($freeActivities)) {
            usort($freeActivities, fn ($a, $b) => abs($at->diffInSeconds($a->startsAt(), false)) <=> abs($at->diffInSeconds($b->startsAt(), false)));
            return $this->recordTimeIn($scan, $user, $freeActivities[0], $at);
        }

        return $this->finish($scan, $finished ? 'already_done' : 'no_activity');
    }

    private function recordTimeIn(BiometricScan $scan, User $user, $activity, Carbon $at): BiometricScan
    {
        $record = Attendance::create([
            'user_id'           => $user->id,
            'activity_id'       => $activity->id,
            'date'              => Carbon::parse($activity->date)->toDateString(),
            'time_in'           => $at,
            'time_in_status'    => $activity->timeInStatusAt($at),
            'attendance_method' => 'fingerprint',
            'status'            => 'present',
        ]);

        $this->notifyAttendance($user, 'time_in', $activity, $at, null, $activity->timeInStatusAt($at));

        return $this->finish($scan, 'time_in', $record->id);
    }

    private function recordTimeOut(BiometricScan $scan, User $user, $activity, Attendance $record, Carbon $at): BiometricScan
    {
        $status = $activity->timeOutStatusAt($at);

        $start = $activity->startsAt();
        $end   = $activity->endsAt();

        $countedFrom  = $record->time_in->gt($start) ? $record->time_in : $start;
        $countedUntil = $at->gt($end) ? $end : $at;
        $minutes      = max(0, $countedFrom->diffInMinutes($countedUntil, false));
        $hours        = round($minutes / 60, 2);

        $record->update([
            'time_out'        => $at,
            'time_out_status' => $status,
            'hours_rendered'  => $hours,
            'left_early'      => $status === 'early',
            'late_time_out'   => $status === 'late',
        ]);

        $this->notifyAttendance($user, 'time_out', $activity, $at, $hours, $status);

        return $this->finish($scan, 'time_out', $record->id);
    }

    /** Bell notification for fingerprint Time In / Time Out. Never breaks the scan. */
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
    private function finish(BiometricScan $scan, string $result, ?int $attendanceId = null): BiometricScan
    {
        $scan->result = $result;
        $scan->attendance_id = $attendanceId;
        $scan->save();

        return $scan;
    }

    private function notifySafely($user, $notification): void
    {
        try {
            $user->notify($notification);
        } catch (\Throwable $e) {
            Log::error('AttendanceRecorded notification failed: ' . $e->getMessage(), ['user_id' => $user->id]);
        }
    }
}