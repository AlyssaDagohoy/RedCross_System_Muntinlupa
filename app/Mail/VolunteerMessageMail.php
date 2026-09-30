<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VolunteerMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $senderName,
        public string $subjectLine,
        public string $body,
    ) {}

    public function build()
    {
        return $this->subject($this->subjectLine)
            ->view('emails.volunteer-message')
            ->with([
                'senderName' => $this->senderName,
                'body' => $this->body,
            ]);
    }
}
