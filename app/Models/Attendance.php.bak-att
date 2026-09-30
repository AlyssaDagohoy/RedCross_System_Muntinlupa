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
        'hours_rendered',
        'latitude',
        'longitude',
        'attendance_method',
        'status',
    ];

    protected $casts = [
        'time_in'    => 'datetime',
        'time_out'   => 'datetime',
        'date'       => 'date',
        'left_early' => 'boolean',
    ];

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
            if ($activity->endsAt()->isFuture()) {
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