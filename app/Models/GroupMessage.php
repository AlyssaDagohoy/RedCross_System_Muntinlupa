<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupMessage extends Model
{
    protected $fillable = [
        'user_id', 'sender_type', 'label', 'body',
        'attachment_path', 'attachment_name', 'attachment_mime',
    ];
}