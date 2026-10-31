<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiometricDevice extends Model
{
    protected $fillable = ['serial_number', 'name', 'last_seen_at'];

    protected $casts = [
        'last_seen_at' => 'datetime',
    ];
}