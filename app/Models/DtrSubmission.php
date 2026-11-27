<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DtrSubmission extends Model
{
    public const REASONS = [
        'no_signal' => 'No signal / remote area',
        'sick'      => 'Sick / medical',
        'emergency' => 'Emergency',
        'other'     => 'Other',
    ];

    public const DEADLINE_DAYS = 3;

    protected $fillable = [
        'user_id', 'activity_id', 'filing_type', 'reason_type', 'date',
        'time_in', 'time_out', 'location', 'details', 'witness',
        'proof_path', 'proof_name', 'status', 'decision',
        'admin_remark', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'date'        => 'date',
        'reviewed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function toUi(): array
    {
        return [
            'id'           => $this->id,
            'user'         => ['id' => $this->user?->id, 'name' => $this->user?->name],
            'activity'     => ['id' => $this->activity?->id, 'name' => $this->activity?->name],
            'filing_type'  => $this->filing_type,
            'reason_type'  => $this->reason_type,
            'reason_label' => self::REASONS[$this->reason_type] ?? $this->reason_type,
            'date'         => $this->date?->toDateString(),
            'time_in'      => $this->time_in,
            'time_out'     => $this->time_out,
            'location'     => $this->location,
            'details'      => $this->details,
            'witness'      => $this->witness,
            'proof_name'   => $this->proof_name,
            'status'       => $this->status,
            'decision'     => $this->decision,
            'admin_remark' => $this->admin_remark,
            'created_at'   => $this->created_at?->toDateTimeString(),
        ];
    }
}