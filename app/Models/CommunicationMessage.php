<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommunicationMessage extends Model
{
    protected $fillable = ['sent_email_id', 'sender_type', 'admin_id', 'admin_label', 'body', 'attachment_path', 'attachment_name', 'attachment_mime'];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function thread()
    {
        return $this->belongsTo(SentEmail::class, 'sent_email_id');
    }
}