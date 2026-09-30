<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    /** Time In opens this many minutes before the activity starts. */
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

    public function timeInOpensAt(): Carbon
    {
        return $this->startsAt()->copy()->subMinutes(self::TIME_IN_OPENS_MINUTES_BEFORE);
    }
}