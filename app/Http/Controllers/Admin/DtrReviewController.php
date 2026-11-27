<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\DtrSubmission;
use App\Notifications\DtrDecided;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DtrReviewController extends Controller
{
    public function proof(DtrSubmission $dtr)
    {
        abort_unless($dtr->proof_path && Storage::disk('local')->exists($dtr->proof_path), 404);

        return Storage::disk('local')->response($dtr->proof_path, $dtr->proof_name);
    }

    public function review(Request $request, DtrSubmission $dtr)
    {
        $data = $request->validate([
            'decision' => 'required|in:excused,present,reject',
            'remark'   => 'nullable|string|max:1000',
        ]);

        if ($dtr->status !== 'pending') {
            return back()->withErrors(['review' => 'This DTR was already reviewed.']);
        }

        if ($data['decision'] === 'reject' && blank($data['remark'] ?? null)) {
            return back()->withErrors(['review' => 'Please add a remark when rejecting a DTR.']);
        }

        $actName = $dtr->activity?->name ?? 'the activity';
        $remark  = $data['remark'] ?? null;

        if ($data['decision'] === 'reject') {
            $dtr->update([
                'status'       => 'rejected',
                'admin_remark' => $remark,
                'reviewed_by'  => auth()->id(),
                'reviewed_at'  => now(),
            ]);
            $dtr->user?->notify(new DtrDecided($actName, 'rejected', $remark));

            return back()->with('message', 'DTR rejected.');
        }

        $date = $dtr->date->toDateString();

        $fields = [
            'date'              => $date,
            'attendance_method' => 'manual',
            'review_reason'     => 'DTR (' . (DtrSubmission::REASONS[$dtr->reason_type] ?? $dtr->reason_type) . '): ' . $dtr->details,
            'admin_remark'      => $remark,
            'reviewed_by'       => auth()->id(),
            'reviewed_at'       => now(),
        ];

        if ($data['decision'] === 'excused') {
            $fields['status']         = 'excused';
            $fields['hours_rendered'] = 0;
            $fields['time_in']        = null;
            $fields['time_out']       = null;
        } else {
            if (!$dtr->time_in || !$dtr->time_out) {
                return back()->withErrors(['review' => 'This DTR has no Time In and Time Out, so it cannot be approved as Present. Mark it Excused instead.']);
            }

            $in  = Carbon::parse($date . ' ' . $dtr->time_in);
            $out = Carbon::parse($date . ' ' . $dtr->time_out);
            if ($out->lte($in)) {
                $out->addDay();
            }

            $fields['status']         = 'present';
            $fields['time_in']        = $in;
            $fields['time_out']       = $out;
            $fields['hours_rendered'] = round(max(0, $in->diffInMinutes($out, false)) / 60, 2);
            $fields['left_early']     = false;
        }

        DB::transaction(function () use ($dtr, $data, $fields, $remark) {
            Attendance::updateOrCreate(
                ['user_id' => $dtr->user_id, 'activity_id' => $dtr->activity_id],
                $fields
            );

            $dtr->update([
                'status'       => 'approved',
                'decision'     => $data['decision'],
                'admin_remark' => $remark,
                'reviewed_by'  => auth()->id(),
                'reviewed_at'  => now(),
            ]);
        });

        $dtr->user?->notify(new DtrDecided($actName, $data['decision'], $remark));

        return back()->with('message', 'DTR approved.');
    }
}