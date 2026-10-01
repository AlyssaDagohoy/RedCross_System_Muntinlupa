<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceReviewController extends Controller
{
    /** The volunteer asks the admin to review a record (forgot Time Out, cannot return to the location, etc.). */
    public function store(Request $request, Attendance $attendance)
    {
        abort_unless($attendance->user_id === auth()->id(), 403);

        $data = $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ]);

        if (!$attendance->time_in || $attendance->time_out || !in_array($attendance->status, ['present', 'needs_review'], true)) {
            return back()->withErrors(['reason' => 'This record cannot be sent for review.']);
        }

        $attendance->update([
            'status'              => 'needs_review',
            'review_reason'       => $data['reason'],
            'review_requested_at' => now(),
        ]);

        return back()->with('success', 'Review request sent. The admin will check your attendance.');
    }
}