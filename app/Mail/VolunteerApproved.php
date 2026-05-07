<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VolunteerApproved extends Mailable
{
    use Queueable, SerializesModels;

    public User $volunteer;

    public function __construct(User $volunteer)
    {
        $this->volunteer = $volunteer;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Volunteer Account Has Been Approved!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.volunteer-approved',
        );
    }
}