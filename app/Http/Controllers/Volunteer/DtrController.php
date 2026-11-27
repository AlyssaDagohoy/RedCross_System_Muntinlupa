<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Attendance;
use App\Models\DtrSubmission;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DtrController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $activities = Activity::whereHas('volunteers', fn ($q) => $q->where('users.id', $user->id))
            ->where('status', '!=', 'cancelled')
            ->whereDate('date', '>=', today()->subDays(DtrSubmission::DEADLINE_DAYS))
            ->orderBy('date')
            ->get(['id', 'name', 'date'])
            ->map(fn ($a) => [
                'id'   => $a->id,
                'name' => $a->name,
                'date' => Carbon::parse($a->date)->toDateString(),
            ]);

        $submissions = DtrSubmission::with(['user', 'activity'])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn ($d) => $d->toUi())
            ->values();

        return Inertia::render('Volunteer/DTR', [
            'activities'   => $activities,
            'submissions'  => $submissions,
            'reasons'      => DtrSubmission::REASONS,
            'deadlineDays' => DtrSubmission::DEADLINE_DAYS,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'filing_type' => 'required|in:before,after',
            'activity_id' => 'required|integer|exists:activities,id',
            'reason_type' => 'required|in:' . implode(',', array_keys(DtrSubmission::REASONS)),
            'time_in'     => 'nullable|date_format:H:i',
            'time_out'    => 'nullable|date_format:H:i',
            'location'    => 'nullable|string|max:255',
            'details'     => 'required|string|min:5|max:1000',
            'witness'     => 'nullable|string|max:255',
            'proof'       => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ], [
            'proof.required' => 'Please attach your proof (a selfie, medical certificate or other document).',
            'proof.mimes'    => 'Proof must be a JPG, PNG or PDF file.',
            'proof.max'      => 'Proof must be 5 MB or smaller.',
        ]);

        $activity = Activity::whereHas('volunteers', fn ($q) => $q->where('users.id', $user->id))
            ->find($data['activity_id']);

        if (!$activity) {
            return back()->withErrors(['activity_id' => 'You are not assigned to this activity.']);
        }

        $actDate = Carbon::parse($activity->date)->startOfDay();

        if ($data['filing_type'] === 'before' && $actDate->lt(today())) {
            return back()->withErrors(['filing_type' => 'This activity already happened. Choose "File after I return".']);
        }
        if ($data['filing_type'] === 'after') {
            if ($actDate->gt(today())) {
                return back()->withErrors(['filing_type' => 'This activity has not happened yet. Choose "File before I leave".']);
            }
            if ($actDate->lt(today()->subDays(DtrSubmission::DEADLINE_DAYS))) {
                return back()->withErrors(['activity_id' => 'The ' . DtrSubmission::DEADLINE_DAYS . '-day filing deadline for this activity has passed.']);
            }
        }

        if (DtrSubmission::where('user_id', $user->id)->where('activity_id', $activity->id)->where('status', 'pending')->exists()) {
            return back()->withErrors(['activity_id' => 'You already have a pending DTR for this activity.']);
        }

        if (Attendance::where('user_id', $user->id)->where('activity_id', $activity->id)->whereIn('status', ['present', 'excused'])->exists()) {
            return back()->withErrors(['activity_id' => 'Your attendance for this activity is already recorded.']);
        }

        $file = $request->file('proof');
        $path = $file->store('dtr', 'local');

        DtrSubmission::create([
            'user_id'     => $user->id,
            'activity_id' => $activity->id,
            'filing_type' => $data['filing_type'],
            'reason_type' => $data['reason_type'],
            'date'        => $actDate->toDateString(),
            'time_in'     => $data['time_in'] ?? null,
            'time_out'    => $data['time_out'] ?? null,
            'location'    => $data['location'] ?? null,
            'details'     => $data['details'],
            'witness'     => $data['witness'] ?? null,
            'proof_path'  => $path,
            'proof_name'  => $file->getClientOriginalName(),
            'status'      => 'pending',
        ]);

        // pending DTR shows as Needs review
        $attRow = Attendance::where('user_id', $user->id)->where('activity_id', $activity->id)->first();
        if (!$attRow) {
            Attendance::create([
                'user_id'           => $user->id,
                'activity_id'       => $activity->id,
                'date'              => $actDate->toDateString(),
                'status'            => 'needs_review',
                'attendance_method' => 'dtr',
            ]);
        } elseif ($attRow->status === 'absent') {
            $attRow->update(['status' => 'needs_review', 'attendance_method' => 'dtr']);
        }

return back()->with('success', 'DTR submitted. The admin will review it.');
    }

    public function proof(DtrSubmission $dtr)
    {
        abort_unless($dtr->user_id === auth()->id(), 403);
        abort_unless($dtr->proof_path && Storage::disk('local')->exists($dtr->proof_path), 404);

        return Storage::disk('local')->response($dtr->proof_path, $dtr->proof_name);
    }
}