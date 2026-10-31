<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SentEmail extends Model
{
    protected $fillable = [
        'user_id', 'to', 'subject', 'message', 'reply', 'replied_at',
        'sent_status', 'inbox_status', 'read_at', 'starred_at',
        'chat_key', 'admin_inbox_status', 'admin_sent_status', 'admin_read_at', 'admin_starred_at',
    ];

    protected $casts = [
        'replied_at' => 'datetime',
        'read_at' => 'datetime',
        'starred_at' => 'datetime',
        'admin_read_at' => 'datetime',
        'admin_starred_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(CommunicationMessage::class)->orderBy('created_at');
    }
}
