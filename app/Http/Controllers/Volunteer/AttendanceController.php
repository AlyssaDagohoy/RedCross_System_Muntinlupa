<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Activity;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Activities that already ended with no time in become Absent.
        Attendance::markAbsences($user->id);

        $attendances = Attendance::where('user_id', $user->id)
            ->with('activity')
            ->orderBy('date', 'desc')
            ->get();

        // Prefers an ongoing record (time_out still null) over a completed one, and the
        // most recent time_in among ties. Absent records are skipped so they are never
        // mistaken for an ongoing time in.
        $todayRecord = Attendance::where('user_id', $user->id)
            ->where(function ($q) {
                // today's record, or yesterday's still-open record (activity that runs past midnight)
                $q->whereDate('date', today())
                  ->orWhere(function ($q2) {
                      $q2->whereDate('date', today()->subDay())
                         ->where('status', 'present')
                         ->whereNotNull('time_in')
                         ->whereNull('time_out');
                  });
            })
            ->where('status', '!=', 'needs_review')
            ->where('status', '!=', 'absent')
            ->with('activity')
            ->orderByRaw('time_out IS NULL DESC')
            ->orderBy('time_in', 'desc')
            ->first();

        $totalHours = Attendance::where('user_id', $user->id)
            ->sum('hours_rendered');

        $todayHours = Attendance::where('user_id', $user->id)
            ->whereDate('date', today())
            ->sum('hours_rendered');

        $weekHours = Attendance::where('user_id', $user->id)
            ->whereBetween('date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
            ->sum('hours_rendered');

        $monthHours = Attendance::where('user_id', $user->id)
            ->whereMonth('date', Carbon::now()->month)
            ->whereYear('date', Carbon::now()->year)
            ->sum('hours_rendered');

        // Today's activities only. Time In is only accepted for today, and Time Out
        // looks its activity up in this list.
        $activities = $user->activities()
            ->where('status', '!=', 'cancelled')
            ->whereDate('date', '>=', today()->subDay())
            ->whereDate('date', '<=', today())
            ->get(['activities.id', 'activities.name', 'activities.location_name', 'activities.date', 'activities.latitude', 'activities.longitude', 'activities.radius_meters', 'activities.start_time', 'activities.end_time']);

        // What the "Select Activity" dropdown shows: today's activities the volunteer
        // has NOT timed in for yet. Ones already timed in, completed, or Absent are left out.
        $activities = $activities->filter(function ($a) {
            return Carbon::parse($a->date)->isToday() || $a->timeOutClosesAt()->isFuture();
        })->values();

        $timedInActivityIds = Attendance::where('user_id', $user->id)
            ->whereDate('date', '>=', today()->subDay())
            ->pluck('activity_id')
            ->all();

        $availableActivities = $activities
            ->whereNotIn('id', $timedInActivityIds)
            ->values();

        return Inertia::render('Volunteer/Attendance', [
            'attendances'         => $attendances,
            'todayRecord'         => $todayRecord,
            'totalHours'          => $totalHours,
            'todayHours'          => $todayHours,
            'weekHours'           => $weekHours,
            'monthHours'          => $monthHours,
            'activities'          => $activities,
            'availableActivities' => $availableActivities,
        ]);
    }
}