<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceReviewController extends Controller
{
    public function review(Request $request, Attendance $attendance)
    {
        $data = $request->validate([
            'action'   => 'required|in:approve,adjust,reject',
            'remark'   => 'nullable|string|max:1000',
            'time_out' => 'nullable|date_format:H:i',
        ]);

        $action = $data['action'];

        if ($attendance->status !== 'needs_review') {
            return back()->withErrors(['review' => 'This record is not waiting for review anymore.']);
        }

        if (in_array($action, ['adjust', 'reject'], true) && blank($data['remark'] ?? null)) {
            return back()->withErrors(['review' => 'Please add a remark for this decision.']);
        }

        $in       = $attendance->time_in;
        $activity = $attendance->activity;
        $end      = $activity ? $activity->endsAt() : null;

        $fields = [
            'admin_remark' => $data['remark'] ?? null,
            'reviewed_by'  => auth()->id(),
            'reviewed_at'  => now(),
        ];

        if ($action === 'reject') {
            $fields['status']         = 'rejected';
            $fields['hours_rendered'] = 0;
            $attendance->update($fields);

            return back()->with('message', 'Attendance rejected.');
        }

        if (!$in) {
            return back()->withErrors(['review' => 'This record has no Time In, so it cannot be approved.']);
        }

        if ($action === 'approve') {
            $timeOut = $attendance->time_out ?? $end;
        } else {
            if (empty($data['time_out'])) {
                return back()->withErrors(['review' => 'Please enter the new Time Out.']);
            }

            $timeOut = $in->copy()->setTimeFromTimeString($data['time_out']);

            if ($timeOut->lte($in)) {
                $timeOut->addDay();
            }
        }

        if (!$timeOut) {
            return back()->withErrors(['review' => 'The activity has no end time. Use Adjust to enter a Time Out.']);
        }

        // Hours are counted only between the scheduled start and end.
        $start   = $activity ? $activity->startsAt() : null;
        $from    = ($start && $in->lt($start)) ? $start : $in;
        $counted = ($end && $timeOut->gt($end)) ? $end : $timeOut;
        $hours   = round(max(0, $from->diffInMinutes($counted, false)) / 60, 2);

        $fields['status']         = 'present';
        $fields['time_out']       = $timeOut;
        $fields['hours_rendered'] = $hours;
        $fields['left_early']     = $end ? $timeOut->lt($end) : false;

        $attendance->update($fields);

        return back()->with('message', 'Attendance updated.');
    }

    /**
     * Admin correction for any record: present, absent or excused.
     * Always requires a remark. Marked as a manual entry.
     */
    public function correct(Request $request, Attendance $attendance)
    {
        $data = $request->validate([
            'status'   => 'required|in:present,absent,excused',
            'time_in'  => 'nullable|required_if:status,present|date_format:H:i',
            'time_out' => 'nullable|required_if:status,present|date_format:H:i',
            'remark'   => 'required|string|max:1000',
        ]);

        $fields = [
            'status'            => $data['status'],
            'admin_remark'      => $data['remark'],
            'reviewed_by'       => auth()->id(),
            'reviewed_at'       => now(),
            'attendance_method' => 'manual',
        ];

        if ($data['status'] !== 'present') {
            $fields['time_in']        = null;
            $fields['time_out']       = null;
            $fields['hours_rendered'] = null;
            $fields['left_early']     = false;
            $fields['time_in_status'] = null;

            $attendance->update($fields);

            return back()->with('message', 'Attendance updated.');
        }

        $day = $attendance->date->toDateString();
        $in  = \Carbon\Carbon::parse($day . ' ' . $data['time_in']);
        $out = \Carbon\Carbon::parse($day . ' ' . $data['time_out']);

        if ($out->lte($in)) {
            $out->addDay();
        }

        $activity = $attendance->activity;
        $end      = $activity ? $activity->endsAt() : null;

        $fields['time_in']        = $in;
        $fields['time_out']       = $out;
        // Hours are counted only between the scheduled start and end (same rule as the scanner).
        $start   = $activity ? $activity->startsAt() : null;
        $from    = ($start && $in->lt($start)) ? $start : $in;
        $counted = ($end && $out->gt($end)) ? $end : $out;
        $fields['hours_rendered'] = round(max(0, $from->diffInMinutes($counted, false)) / 60, 2);
        $fields['left_early']     = $end ? $out->lt($end) : false;
        $fields['time_in_status'] = $activity ? $activity->timeInStatusAt($in) : null;

        $attendance->update($fields);

        return back()->with('message', 'Attendance updated.');
    }}
