<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * Saved to the `notifications` table when a volunteer times in or out.
 * Shown in the bell on every volunteer page.
 */
class AttendanceRecorded extends Notification
{
    public function __construct(
        private string $type,            // 'time_in' | 'time_out'
        private string $activityName,
        private ?float $hours = null,
        private bool $leftEarly = false,
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        if ($this->type === 'time_in') {
            return [
                'type'    => 'time_in',
                'title'   => "Timed in: {$this->activityName}",
                'message' => "Your attendance is ongoing. Time out when you're done.",
            ];
        }

        $message = "Hours rendered: {$this->hours}";
        if ($this->leftEarly) {
            $message .= ' (left early)';
        }

        return [
            'type'    => 'time_out',
            'title'   => "Timed out: {$this->activityName}",
            'message' => $message,
        ];
    }
}
