<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
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
    ];

    public function volunteers()
    {
        return $this->belongsToMany(User::class, 'activity_volunteer');
    }
}