<?php

use App\Models\Attendance;
use App\Models\DtrSubmission;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        DtrSubmission::where('status', 'pending')->get()->each(function ($dtr) {
            $row = Attendance::where('user_id', $dtr->user_id)->where('activity_id', $dtr->activity_id)->first();

            if (!$row) {
                Attendance::create([
                    'user_id'           => $dtr->user_id,
                    'activity_id'       => $dtr->activity_id,
                    'date'              => $dtr->date->toDateString(),
                    'status'            => 'needs_review',
                    'attendance_method' => 'dtr',
                ]);
            } elseif ($row->status === 'absent') {
                $row->update(['status' => 'needs_review', 'attendance_method' => 'dtr']);
            }
        });
    }

    public function down(): void
    {
        Attendance::where('status', 'needs_review')->where('attendance_method', 'dtr')
            ->update(['status' => 'absent', 'attendance_method' => null]);
    }
};