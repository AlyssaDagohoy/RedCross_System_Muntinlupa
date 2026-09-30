<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FileRequest extends Model
{
    protected $fillable = [
        'user_id',
        'requested_document',
        'type',
        'purpose',
        'status',
        'admin_remarks',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}