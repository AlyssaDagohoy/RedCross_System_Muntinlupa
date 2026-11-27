<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/** Saved to the notifications table when an admin approves or rejects a DTR. */
class DtrDecided extends Notification
{
    public function __construct(
        private string $activityName,
        private string $outcome,   // excused | present | rejected
        private ?string $remark = null,
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        $label = match ($this->outcome) {
            'excused'  => 'approved. You are marked Excused.',
            'present'  => 'approved. Your hours were recorded.',
            default    => 'rejected.',
        };

        $message = "Your DTR for {$this->activityName} was {$label}";
        if ($this->remark) {
            $message .= " Remark: {$this->remark}";
        }

        return [
            'type'    => 'dtr',
            'title'   => 'DTR ' . ($this->outcome === 'rejected' ? 'rejected' : 'approved'),
            'message' => $message,
            'link'    => route('volunteer.dtr'),
        ];
    }
}