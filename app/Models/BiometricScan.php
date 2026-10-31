<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiometricScan extends Model
{
    protected $fillable = [
        'device_serial', 'biometric_id', 'user_id', 'scanned_at',
        'result', 'attendance_id', 'raw',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'raw' => 'array',
    ];
}