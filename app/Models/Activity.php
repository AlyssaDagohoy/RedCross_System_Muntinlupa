<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    /** Not used anymore. The early Time In limit now comes from config/attendance.php. */
    public const TIME_IN_OPENS_MINUTES_BEFORE = 30;

    protected $fillable = [
        'name',
        'description',
        'date',
        'start_time',
        'end_time',
        'location_name',
        'latitude',
        'longitude',
        'radius_meters',
        'status',
        'assigned_by',
    ];

    public function volunteers()
    {
        return $this->belongsToMany(User::class, 'activity_volunteer');
    }

    public function startsAt(): Carbon
    {
        return Carbon::parse(Carbon::parse($this->date)->toDateString() . ' ' . $this->start_time);
    }

    public function endsAt(): Carbon
    {
        $end = Carbon::parse(Carbon::parse($this->date)->toDateString() . ' ' . $this->end_time);

        // Activity that ends after midnight.
        if ($end->lte($this->startsAt())) {
            $end->addDay();
        }

        return $end;
    }

    /** Time In is blocked before this moment (default: 1 hour before the start). */
    public function timeInOpensAt(): Carbon
    {
        return $this->startsAt()->copy()->subMinutes((int) config('attendance.time_in_opens_before', 60));
    }

    /** Time In is "on time" until this moment (default: 15 minutes after the start). */
    public function timeInOnTimeUntil(): Carbon
    {
        return $this->startsAt()->copy()->addMinutes((int) config('attendance.time_in_on_time_window', 15));
    }

    /** Time In stays open until the activity ends. No Time In by then means Absent. */
    public function timeInClosesAt(): Carbon
    {
        return $this->endsAt();
    }

    /** Timing out before this moment is "early" and needs a confirmation. */
    public function earlyTimeOutBefore(): Carbon
    {
        return $this->endsAt()->copy()->subMinutes((int) config('attendance.time_out_early_window', 60));
    }

    /** Time Out closes this many minutes after the activity ends. */
    public function timeOutClosesAt(): Carbon
    {
        return $this->endsAt()->copy()->addMinutes((int) config('attendance.time_out_grace', 60));
    }

    /** 'early', 'on_time' or 'late' for a Time In at the given moment. */
    public function timeInStatusAt(Carbon $at): string
    {
        if ($at->lt($this->startsAt())) {
            return 'early';
        }

        return $at->lte($this->timeInOnTimeUntil()) ? 'on_time' : 'late';
    }

    /** 'early', 'on_time' or 'late' for a Time Out at the given moment. */
    public function timeOutStatusAt(Carbon $at): string
    {
        if ($at->lt($this->earlyTimeOutBefore())) {
            return 'early';
        }

        return $at->lte($this->endsAt()) ? 'on_time' : 'late';
    }
}