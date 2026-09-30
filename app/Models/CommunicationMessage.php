<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommunicationMessage extends Model
{
    protected $fillable = ['sent_email_id', 'sender_type', 'body'];

    public function thread()
    {
        return $this->belongsTo(SentEmail::class, 'sent_email_id');
    }
}