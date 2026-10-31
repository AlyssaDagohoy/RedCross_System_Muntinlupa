<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    /**
     * Only activities on or after this date get automatic Absent records.
     * This keeps old test activities from turning into a pile of Absents.
     * Change it if you want older activities included.
     */
    public const ABSENT_FROM = '2026-09-30';

    protected $fillable = [
        'user_id',
        'activity_id',
        'date',
        'time_in',
        'time_out',
        'left_early',
        'late_time_out',
        'hours_rendered',
        'latitude',
        'longitude',
        'attendance_method',
        'review_reason',
        'review_requested_at',
        'admin_remark',
        'reviewed_by',
        'reviewed_at',
        'status',
        'time_in_status',
        'time_out_status',
        'time_out_latitude',
        'time_out_longitude',
    ];

    protected $casts = [
        'time_in'    => 'datetime',
        'time_out'   => 'datetime',
        'date'       => 'date',
        'left_early' => 'boolean',
        'late_time_out' => 'boolean',
        'review_requested_at' => 'datetime',
        'reviewed_at'         => 'datetime',
    ];

    /**
     * Hide attendance of deleted (soft deleted) volunteers everywhere.
     * The rows stay in the database; they just don't show up in queries.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('activeVolunteer', function ($query) {
            $query->whereHas('user');
        });
    }
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Any record that has a Time In but no Time Out, and whose Time Out window
     * has already closed, becomes "needs_review" so the admin can decide.
     * Safe to call many times. Pass a user id to only check one volunteer.
     */
    public static function closeMissingTimeOuts(?int $userId = null): void
    {
        $records = self::with('activity')
            ->where('status', 'present')
            ->whereNotNull('time_in')
            ->whereNull('time_out')
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->get();

        foreach ($records as $record) {
            $activity = $record->activity;

            if (!$activity || $activity->timeOutClosesAt()->isFuture()) {
                continue;
            }

            $record->update(['status' => 'needs_review']);
        }
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }

    /**
     * Creates an Absent record for every assigned volunteer who never timed in
     * to an activity that has already ended. Safe to call many times.
     * Pass a user id to only check one volunteer.
     */
    public static function markAbsences(?int $userId = null): void
    {
        self::closeMissingTimeOuts($userId);

        $activities = Activity::with(['volunteers' => function ($q) use ($userId) {
                if ($userId) {
                    $q->where('users.id', $userId);
                }
            }])
            ->where('status', '!=', 'cancelled')
            ->whereDate('date', '>=', self::ABSENT_FROM)
            ->whereDate('date', '<=', today())
            ->get();

        foreach ($activities as $activity) {
            if ($activity->timeInClosesAt()->isFuture()) {
                continue;
            }

            foreach ($activity->volunteers as $volunteer) {
                self::firstOrCreate(
                    ['user_id' => $volunteer->id, 'activity_id' => $activity->id],
                    ['date' => \Carbon\Carbon::parse($activity->date)->toDateString(), 'status' => 'absent']
                );
            }
        }
    }
}