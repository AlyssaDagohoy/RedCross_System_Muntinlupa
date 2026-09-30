<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RecordsController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Ended activities with no time in become Absent.
        Attendance::markAbsences($user->id);

        // Feeds both the Attendance tab (simple table) and the Activities
        // tab (expandable full-detail card) on the frontend.
        $attendances = Attendance::where('user_id', $user->id)
            ->with('activity:id,name,location_name,description,assigned_by,status')
            ->orderBy('date', 'desc')
            ->get(['id', 'activity_id', 'date', 'time_in', 'time_out', 'hours_rendered', 'attendance_method', 'status'])
            ->map(function ($a) {
                return [
                    'id'                => $a->id,
                    'date'              => $a->date,
                    'time_in'           => $a->time_in,
                    'time_out'          => $a->time_out,
                    'hours_rendered'    => $a->hours_rendered,
                    'attendance_method' => $a->attendance_method,
                    'attendance_status' => $a->status === 'absent' ? 'Absent' : ($a->time_out ? 'Present' : 'Incomplete'),
                    'activity_name'     => $a->activity->name ?? '—',
                    'location_name'     => $a->activity->location_name ?? '—',
                    'assignment'        => $a->activity->description ?? '—',
                    'assigned_by'       => $a->activity->assigned_by ?? '—',
                    'activity_status'   => $a->activity->status ?? '—',
                ];
            });

        $totalHours = Attendance::where('user_id', $user->id)->sum('hours_rendered');

        return Inertia::render('Volunteer/Records', [
            'attendances' => $attendances,
            'totalHours'  => $totalHours,
        ]);
    }
}
