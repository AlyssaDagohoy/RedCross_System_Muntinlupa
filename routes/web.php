<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VolunteerController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\Volunteer\ProfileController as VolunteerProfileController;
use App\Http\Controllers\Volunteer\AttendanceController;
use App\Http\Controllers\Volunteer\FaceAttendanceController;
use App\Http\Controllers\Volunteer\CommunicationController;
use App\Http\Controllers\Volunteer\RecordsController;
use App\Http\Controllers\Volunteer\File201Controller;
use App\Http\Controllers\Volunteer\NotificationController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\WebAuthn\WebAuthnRegisterController;
use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\AttendanceController as AdminAttendanceController;
use App\Http\Controllers\Admin\CommunicationController as AdminCommunicationController;
use App\Http\Controllers\Admin\DocumentReviewController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/login');

Route::get('/donate', function () {
    return Inertia::render('Donate');
})->name('donate');

Route::get('/news/{slug}', [NewsController::class, 'show'])->name('news.show');

// Admin Routes
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', function () {
        $pendingCount = \App\Models\User::role('volunteer')
            ->where('status', 'pending')
            ->count();
        $totalVolunteers = \App\Models\User::role('volunteer')
            ->where('status', 'approved')
            ->count();
        $activeToday = \App\Models\Attendance::whereDate('date', today())
            ->count();

        $activities = \App\Models\Activity::where('status', '!=', 'cancelled')
            ->whereDate('date', '>=', today())
            ->orderBy('date')
            ->orderBy('start_time')
            ->limit(5)
            ->get()
            ->map(function ($a) {
                $now = now();
                if ($a->status === 'cancelled') {
                    $status = 'CANCELLED';
                } elseif ($now->gt($a->endsAt())) {
                    $status = 'COMPLETED';
                } elseif ($now->gte($a->startsAt())) {
                    $status = 'ONGOING';
                } else {
                    $status = 'ASSIGNED';
                }

                return [
                    'id'            => $a->id,
                    'name'          => $a->name,
                    'date'          => \Carbon\Carbon::parse($a->date)->format('F j, Y'),
                    'start'         => \Carbon\Carbon::parse($a->start_time)->format('g:i A'),
                    'end'           => \Carbon\Carbon::parse($a->end_time)->format('g:i A'),
                    'location_name' => $a->location_name,
                    'assignment'    => $a->description,
                    'assigned_by'   => $a->assigned_by,
                    'status'        => $status,
                ];
            });

        // ---- Dashboard v2 data ----
        \App\Models\Attendance::markAbsences();

        $todayAttendance = \App\Models\Attendance::whereDate('date', today())->get();
        $attendance = [
            'present' => $todayAttendance->whereIn('status', ['present', 'needs_review'])->count(),
            'late'    => $todayAttendance->where('time_in_status', 'late')->count(),
            'absent'  => $todayAttendance->where('status', 'absent')->count(),
        ];

        // Present/late volunteers today, for the dashboard "View Today's Attendance" panel.
        $todayPresent = $todayAttendance
            ->load('user:id,name,photo', 'activity')
            ->filter(fn ($r) => $r->time_in && in_array($r->status, ['present', 'needs_review']))
            ->map(function ($r) {
                $act = $r->activity;
                return [
                    'id'        => $r->id,
                    'volunteer' => $r->user?->name ?? 'Unknown volunteer',
                    'photo_url' => $r->user?->photo ? \Illuminate\Support\Facades\Storage::disk('public')->url($r->user->photo) : null,
                    'arrival'   => $r->time_in_status,
                    'time_in'   => $r->time_in ? \Carbon\Carbon::parse($r->time_in)->format('g:i A') : null,
                    'time_out'  => $r->time_out ? \Carbon\Carbon::parse($r->time_out)->format('g:i A') : null,
                    'activity'  => $act ? [
                        'id'            => $act->id,
                        'name'          => $act->name,
                        'type'          => $act->type ?: 'field',
                        'location_name' => $act->location_name,
                        'date'          => \Carbon\Carbon::parse($act->date)->format('F j, Y'),
                        'start'         => \Carbon\Carbon::parse($act->start_time)->format('g:i A'),
                        'end'           => \Carbon\Carbon::parse($act->end_time)->format('g:i A'),
                    ] : null,
                ];
            })
            ->values();
        // Absent volunteers today, for the dashboard Absent tab.
        $absentToday = $todayAttendance
            ->where('status', 'absent')
            ->map(function ($r) {
                $act = $r->activity;
                $actStatus = null;
                if ($act) {
                    $now = now();
                    $actStatus = $now->gt($act->endsAt()) ? 'COMPLETED' : ($now->gte($act->startsAt()) ? 'ONGOING' : 'UPCOMING');
                }
                return [
                    'id'        => $r->id,
                    'volunteer' => $r->user?->name ?? 'Unknown volunteer',
                    'arrival'   => 'absent',
                    'time_in'   => null,
                    'time_out'  => null,
                    'activity'  => $act ? [
                        'id'            => $act->id,
                        'name'          => $act->name,
                        'type'          => $act->type ?: 'field',
                        'location_name' => $act->location_name,
                        'date'          => \Carbon\Carbon::parse($act->date)->format('F j, Y'),
                        'start'         => \Carbon\Carbon::parse($act->start_time)->format('g:i A'),
                        'end'           => \Carbon\Carbon::parse($act->end_time)->format('g:i A'),
                        'status'        => $actStatus,
                    ] : null,
                ];
            })
            ->values();

        $todayModels = \App\Models\Activity::with('volunteers:users.id,users.name')
            ->withCount('volunteers')
            ->whereDate('date', today())
            ->where('status', '!=', 'cancelled')
            ->orderBy('start_time')
            ->get();

        $todayActivities = $todayModels->map(function ($a) use ($todayAttendance) {
            $now = now();
            if ($now->gt($a->endsAt())) {
                $status = 'COMPLETED';
            } elseif ($now->gte($a->startsAt())) {
                $status = 'ONGOING';
            } else {
                $status = 'UPCOMING';
            }

            return [
                'id'               => $a->id,
                'name'             => $a->name,
                'type'             => $a->type ?: 'field',
                'date'             => \Carbon\Carbon::parse($a->date)->format('F j, Y'),
                'start'            => \Carbon\Carbon::parse($a->start_time)->format('g:i A'),
                'end'              => \Carbon\Carbon::parse($a->end_time)->format('g:i A'),
                'location_name'    => $a->location_name,
                'volunteers_count' => $a->volunteers_count,
                'volunteers'       => $a->volunteers->map(function ($v) use ($todayAttendance, $a) {
                    $rec = $todayAttendance->first(fn ($r) => $r->activity_id == $a->id && $r->user_id == $v->id);
                    return [
                        'id'      => $v->id,
                        'name'    => $v->name,
                        'arrival' => ! $rec ? 'not_in' : ($rec->status === 'absent' ? 'absent' : ($rec->time_in ? ($rec->time_in_status ?: 'on_time') : 'not_in')),
                        'time_in' => $rec && $rec->time_in ? \Carbon\Carbon::parse($rec->time_in)->format('g:i A') : null,
                    ];
                })->values(),
                'status'           => $status,
            ];
        });

        $reminders = [];

        // Volunteer messages nobody has answered yet
        $unanswered = \App\Models\SentEmail::where('admin_inbox_status', 'active')
            ->whereNull('reply')
            ->whereDoesntHave('messages', fn ($q) => $q->where('sender_type', 'admin'))
            ->count();
        if ($unanswered > 0) {
            $reminders[] = [
                'text'  => $unanswered . ' message' . ($unanswered > 1 ? 's need' : ' needs') . ' a reply',
                'href'  => route('admin.communication'),
                'level' => 'high',
            ];
        }

        // Documents waiting for the admin's review
        $docsPending = \App\Models\Document::where('status', 'pending')->count();
        if ($docsPending > 0) {
            $reminders[] = [
                'text'  => $docsPending . ' document' . ($docsPending > 1 ? 's' : '') . ' waiting for review',
                'href'  => route('admin.document-review.index'),
                'level' => 'high',
            ];
        }

        if (($pendingCount ?? 0) > 0) {
            $reminders[] = [
                'text'  => $pendingCount . ' volunteer' . ($pendingCount > 1 ? 's are' : ' is') . ' waiting for approval',
                'href'  => route('admin.volunteers', ['filter' => 'pending']),
                'level' => 'normal',
            ];
        }

        $needsReview = \App\Models\Attendance::where('status', 'needs_review')->count();
        if ($needsReview > 0) {
            $reminders[] = [
                'text'  => $needsReview . ' attendance record' . ($needsReview > 1 ? 's need' : ' needs') . ' review',
                'href'  => route('admin.attendance.index'),
                'level' => 'normal',
            ];
        }

        foreach ($todayModels as $a) {
            if (now()->lt($a->startsAt())) {
                $mins = (int) round(abs(now()->diffInMinutes($a->startsAt())));
                if ($mins <= 60) {
                    $reminders[] = [
                        'text'  => $a->name . ' starts in ' . $mins . ' minute' . ($mins === 1 ? '' : 's'),
                        'href'  => route('admin.activities.index', ['status' => 'upcoming', 'highlight' => $a->id]),
                        'level' => 'high',
                    ];
                }
            }
        }

        // Activities in the next 7 days (today's are shown separately)
        $upcomingWeek = \App\Models\Activity::withCount('volunteers')
            ->whereDate('date', '>', today())
            ->whereDate('date', '<=', today()->addDays(7))
            ->where('status', '!=', 'cancelled')
            ->orderBy('date')
            ->orderBy('start_time')
            ->take(3)
            ->get()
            ->map(fn ($a) => [
                'id'               => $a->id,
                'name'             => $a->name,
                'type'             => $a->type ?: 'field',
                'weekday'          => \Carbon\Carbon::parse($a->date)->format('D'),
                'day'              => \Carbon\Carbon::parse($a->date)->format('j'),
                'date_label'       => \Carbon\Carbon::parse($a->date)->format('F j, Y'),
                'date_short'       => \Carbon\Carbon::parse($a->date)->format('M j'),
                'time_range'       => \Carbon\Carbon::parse($a->start_time)->format('g:i A') . ' to ' . \Carbon\Carbon::parse($a->end_time)->format('g:i A'),
                'description'      => $a->description,
                'assigned_by'      => $a->assigned_by,
                'start'            => \Carbon\Carbon::parse($a->start_time)->format('g:i A'),
                'location_name'    => $a->location_name,
                'volunteers_count' => $a->volunteers_count,
            ])
            ->values();
        // ---- end Dashboard v2 data ----

        return Inertia::render('Admin/Dashboard', [
            'pendingCount'    => $pendingCount,
            'todayPresent'    => $todayPresent,
            'absentToday'     => $absentToday,
            'totalVolunteers' => $totalVolunteers,
            'activeToday'     => $activeToday,
            'activities'      => $activities,
            'attendance'      => $attendance,
            'fieldActivities' => $todayActivities->where('type', 'field')->values(),
            'branchActivities'=> $todayActivities->where('type', 'branch')->values(),
            'reminders'       => $reminders,
            'todayActivities' => $todayActivities->values(),
            'upcoming'        => $upcomingWeek,
        ]);
    })->name('dashboard');

    Route::get('/volunteers', [VolunteerController::class, 'index'])->name('volunteers');
    Route::patch('/volunteers/{id}/approve', [VolunteerController::class, 'approve'])->name('volunteers.approve');
    Route::patch('/volunteers/{id}/reject', [VolunteerController::class, 'reject'])->name('volunteers.reject');
    Route::post('/volunteers/{id}/request-document', [VolunteerController::class, 'requestDocument'])->name('volunteers.request-document');
    Route::delete('/volunteers/{id}', [VolunteerController::class, 'destroy'])->name('volunteers.destroy');

    // Activities
    Route::get('/activities', [ActivityController::class, 'index'])->name('activities.index');
    Route::get('/activities/create', [ActivityController::class, 'create'])->name('activities.create');
    Route::post('/activities', [ActivityController::class, 'store'])->name('activities.store');
    Route::get('/activities/{activity}/edit', [ActivityController::class, 'edit'])->name('activities.edit');
    Route::patch('/activities/{activity}', [ActivityController::class, 'update'])->name('activities.update');
    Route::delete('/activities/{activity}', [ActivityController::class, 'destroy'])->name('activities.destroy');

    // Attendance
    Route::get('/attendance', [AdminAttendanceController::class, 'index'])->name('attendance.index');
    Route::post('/attendance/{attendance}/review', [\App\Http\Controllers\Admin\AttendanceReviewController::class, 'review'])->name('attendance.review');
    Route::post('/attendance/{attendance}/correct', [\App\Http\Controllers\Admin\AttendanceReviewController::class, 'correct'])->name('attendance.correct');
    Route::get('/attendance/export-pdf', [AdminAttendanceController::class, 'exportPdf'])->name('attendance.export.pdf');
    Route::get('/attendance/export-excel', [AdminAttendanceController::class, 'exportExcel'])->name('attendance.export.excel');

    // Communication
    Route::get('/communication', [AdminCommunicationController::class, 'index'])->name('communication');
    Route::post('/communication/reply/{sentEmail}', [AdminCommunicationController::class, 'reply'])->name('communication.reply');
    Route::post('/communication/announce', [AdminCommunicationController::class, 'announce'])->name('communication.announce');
    Route::post('/communication/start', [AdminCommunicationController::class, 'start'])->name('communication.start');
    Route::delete('/communication/announcement/{announcement}', [AdminCommunicationController::class, 'deleteAnnouncement'])->name('communication.announcement.delete');
        Route::patch('/communication/announcement/{announcement}', [AdminCommunicationController::class, 'updateAnnouncement'])->name('communication.announcement.update');
        Route::post('/communication/announcement/{announcement}/pin', [AdminCommunicationController::class, 'pinAnnouncement'])->name('communication.announcement.pin');
        Route::post('/communication/announcement/{announcement}/archive', [AdminCommunicationController::class, 'archiveAnnouncement'])->name('communication.announcement.archive');
        Route::post('/communication/announcement/{id}/restore', [AdminCommunicationController::class, 'restoreAnnouncement'])->name('communication.announcement.restore');
        Route::delete('/communication/announcement/{id}/purge', [AdminCommunicationController::class, 'purgeAnnouncement'])->name('communication.announcement.purge');
    Route::post('/communication/read', [AdminCommunicationController::class, 'markRead'])->name('communication.read');
    Route::post('/communication/{sentEmail}/star', [AdminCommunicationController::class, 'toggleStar'])->name('communication.star');
    Route::post('/communication/archive', [AdminCommunicationController::class, 'archive'])->name('communication.archive');
    Route::post('/communication/trash', [AdminCommunicationController::class, 'trash'])->name('communication.trash');
    Route::post('/communication/restore', [AdminCommunicationController::class, 'restore'])->name('communication.restore');
    Route::post('/communication/purge', [AdminCommunicationController::class, 'purge'])->name('communication.purge');
    Route::get('/communication/attachment/{message}', [AdminCommunicationController::class, 'attachment'])->name('communication.attachment');
    Route::patch('/communication/message/{message}/label', [AdminCommunicationController::class, 'relabel'])->name('communication.relabel');

    // Admin Profile
    Route::get('/profile', [AdminProfileController::class, 'edit'])->name('profile');
    Route::patch('/profile', [AdminProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/password', [AdminProfileController::class, 'updatePassword'])->name('profile.password');

    // Document Review
    Route::get('/document-review', [DocumentReviewController::class, 'index'])->name('document-review.index');
    Route::patch('/document-review/{document}/approve', [DocumentReviewController::class, 'approve'])->name('document-review.approve');
    Route::patch('/document-review/{document}/reject', [DocumentReviewController::class, 'reject'])->name('document-review.reject');
    Route::get('/document-review/{document}/view', [DocumentReviewController::class, 'view'])->name('document-review.view');
    Route::get('/document-review/{document}/download', [DocumentReviewController::class, 'download'])->name('document-review.download');
});

// Volunteer Routes
Route::middleware(['auth', 'role:volunteer'])->prefix('volunteer')->name('volunteer.')->group(function () {

    Route::get('/dashboard', function () {
        $user = auth()->user();

        $totalHours = \App\Models\Attendance::where('user_id', $user->id)->sum('hours_rendered');
        $totalDays  = \App\Models\Attendance::where('user_id', $user->id)->count();
        $monthDays  = \App\Models\Attendance::where('user_id', $user->id)
            ->whereMonth('date', now()->month)
            ->count();

        $assignedActivities = $user->activities()
            ->where('date', '>=', now()->startOfDay())
            ->orderBy('date', 'asc')
            ->get(['activities.id', 'activities.name', 'activities.date', 'activities.location_name', 'activities.start_time', 'activities.end_time', 'activities.description', 'activities.assigned_by']);

        \App\Models\Attendance::markAbsences($user->id);

        $recentAttendance = \App\Models\Attendance::where('user_id', $user->id)
            ->with('activity:id,name,date,location_name,start_time,end_time')
            ->orderBy('date', 'desc')
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get(['id', 'activity_id', 'date', 'time_in', 'time_out', 'hours_rendered', 'status', 'attendance_method']);

        $todayAttendance = \App\Models\Attendance::where('user_id', $user->id)
            ->whereDate('date', today())
            ->get(['activity_id', 'time_in', 'time_out', 'hours_rendered', 'status']);

        $activities = $user->activities()
            ->where('status', '!=', 'cancelled')
            ->whereDate('date', '>=', today())
            ->get(['activities.id', 'activities.name', 'activities.location_name', 'activities.date', 'activities.latitude', 'activities.longitude', 'activities.radius_meters', 'activities.start_time', 'activities.end_time', 'activities.description', 'activities.assigned_by']);

        return Inertia::render('Volunteer/Dashboard', [
            'auth'               => ['user' => $user],
            'totalHours'         => $totalHours,
            'totalDays'          => $totalDays,
            'monthDays'          => $monthDays,
            'assignedActivities' => $assignedActivities,
            'recentAttendance'   => $recentAttendance,
            'todayAttendance'    => $todayAttendance,
            'activities'         => $activities,
        ]);
    })->name('dashboard');

    Route::get('/schedule', function () {
        $user = auth()->user();

        $activities = $user->activities()
            ->orderBy('date', 'asc')
            ->get([
                'activities.id',
                'activities.name',
                'activities.date',
                'activities.start_time',
                'activities.end_time',
                'activities.location_name',
                'activities.status',
                'activities.description',
                'activities.assigned_by',
            ]);

        // pull this volunteer's own attendance for these activities so the status shown
        // (assigned/ongoing/completed/missed) reflects THEIR Time In/Out, not just the
        // activity's admin-set status column. time_out is also kept so completed activities
        // on the same date can be sorted by most-recently-completed first.
        \App\Models\Attendance::markAbsences($user->id);

        $attendanceByActivity = \App\Models\Attendance::where('user_id', $user->id)
            ->whereIn('activity_id', $activities->pluck('id'))
            ->get(['activity_id', 'time_in', 'time_out', 'status'])
            ->keyBy('activity_id');

        $activities = $activities->map(function ($act) use ($attendanceByActivity) {
            $rec = $attendanceByActivity->get($act->id);

            // compares dates only (startOfDay), so today's own activities are never
            // marked missed ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â just ones whose date has fully passed with no attendance
            $isPastDate = \Carbon\Carbon::parse($act->date)->startOfDay()->lt(today());

            if ($act->status === 'cancelled') {
                // stays cancelled
            } elseif ($rec && $rec->status === 'absent') {
                $act->status = 'missed';
            } elseif ($rec && $rec->time_out) {
                $act->status = 'completed';
            } elseif ($rec && $rec->time_in) {
                $act->status = 'ongoing';
            } elseif ($isPastDate && !$rec) {
                // date has passed and the volunteer never timed in ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â distinct from "assigned"
                $act->status = 'missed';
            } else {
                $act->status = 'assigned';
            }

            // expose the raw time_out so the frontend can break ties between
            // same-date completed activities (most recently completed goes first)
            $act->time_out = $rec?->time_out;

            return $act;
        });

        // schedule-fix: variables the render below expects
        $attendance = \App\Models\Attendance::where('user_id', $user->id)
            ->whereDate('date', today())
            ->get(['activity_id', 'time_in', 'time_out', 'hours_rendered', 'status']);

        $todayActivities = $activities
            ->filter(fn ($a) => \Carbon\Carbon::parse($a->date)->isToday())
            ->values();

        $reminders = collect();
        return Inertia::render('Volunteer/Schedule', [
            'auth'       => ['user' => $user],
            'activities' => $activities,
            'attendance'      => $attendance,
            'fieldActivities' => $todayActivities->where('type', 'field')->values(),
            'branchActivities'=> $todayActivities->where('type', 'branch')->values(),
            'reminders'       => $reminders,
        ]);
    })->name('schedule');

    // Communication
    Route::get('/communication', [CommunicationController::class, 'index'])->name('communication');
    Route::post('/communication/send', [CommunicationController::class, 'send'])->name('communication.send');
    Route::post('/communication/{email}/reply', [CommunicationController::class, 'reply'])->name('communication.reply');
    Route::post('/communication/read', [CommunicationController::class, 'markRead'])->name('communication.read');
    Route::post('/communication/{email}/star', [CommunicationController::class, 'toggleStar'])->name('communication.star');
    Route::post('/communication/archive', [CommunicationController::class, 'archive'])->name('communication.archive');
    Route::post('/communication/trash', [CommunicationController::class, 'trash'])->name('communication.trash');
    Route::post('/communication/restore', [CommunicationController::class, 'restore'])->name('communication.restore');
    Route::post('/communication/purge', [CommunicationController::class, 'purge'])->name('communication.purge');
    Route::get('/communication/attachment/{message}', [CommunicationController::class, 'attachment'])->name('communication.attachment');

    Route::get('/profile', [VolunteerProfileController::class, 'edit'])->name('profile');
    Route::patch('/profile', [VolunteerProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/password', [VolunteerProfileController::class, 'updatePassword'])->name('profile.password');

    Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance');
    Route::post('/attendance/{attendance}/request-review', [\App\Http\Controllers\Volunteer\AttendanceReviewController::class, 'store'])->name('attendance.request-review');
    Route::post('/attendance/time-in', [AttendanceController::class, 'timeIn'])->name('attendance.timein');
    Route::post('/attendance/time-out', [AttendanceController::class, 'timeOut'])->name('attendance.timeout');

    // Records
    Route::get('/records', [RecordsController::class, 'index'])->name('records');

    // 201 File ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â compliance uploads, approved files, folders, and requests all live here.
    // view/download routes stream the file through an ownership check ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â no raw storage URL is ever exposed.
    Route::get('/file201', [File201Controller::class, 'index'])->name('file201');
    Route::post('/file201/uploads', [File201Controller::class, 'storeUpload'])->name('file201.uploads.store');
    Route::delete('/file201/uploads/{id}', [File201Controller::class, 'destroyUpload'])->name('file201.uploads.destroy');
    Route::get('/file201/uploads/{document}/view', [File201Controller::class, 'viewUpload'])->name('file201.uploads.view');
    Route::get('/file201/uploads/{document}/download', [File201Controller::class, 'downloadUpload'])->name('file201.uploads.download');
    Route::get('/file201/documents/{document}/view', [File201Controller::class, 'viewApproved'])->name('file201.approved.view');
    Route::get('/file201/documents/{document}/download', [File201Controller::class, 'downloadApproved'])->name('file201.approved.download');
    Route::post('/file201/folders', [File201Controller::class, 'storeFolder'])->name('file201.folders.store');
    Route::delete('/file201/folders/{folder}', [File201Controller::class, 'destroyFolder'])->name('file201.folders.destroy');
    Route::post('/file201/archive', [File201Controller::class, 'archiveDocuments'])->name('file201.archive');
    Route::patch('/file201/documents/{document}/move', [File201Controller::class, 'moveDocument'])->name('file201.documents.move');
    Route::post('/file201/documents/{document}/copy', [File201Controller::class, 'copyDocument'])->name('file201.documents.copy');
    Route::delete('/file201/documents/{document}', [File201Controller::class, 'destroyCopy'])->name('file201.documents.destroy');
    Route::post('/file201/trash/{id}/restore', [File201Controller::class, 'restoreCopy'])->name('file201.trash.restore');
    Route::delete('/file201/trash/{id}', [File201Controller::class, 'forceDeleteCopy'])->name('file201.trash.destroy');
    Route::delete('/file201/trash', [File201Controller::class, 'emptyTrash'])->name('file201.trash.empty');
    Route::post('/file201/folders/{folder}/copy', [File201Controller::class, 'copyFolder'])->name('file201.folders.copy');
    Route::patch('/file201/documents/{document}/star', [File201Controller::class, 'toggleStarDocument'])->name('file201.documents.star');
    Route::patch('/file201/folders/{folder}/star', [File201Controller::class, 'toggleStarFolder'])->name('file201.folders.star');
    Route::patch('/file201/documents/{document}/rename', [File201Controller::class, 'renameDocument'])->name('file201.documents.rename');
    Route::patch('/file201/folders/{folder}/rename', [File201Controller::class, 'renameFolder'])->name('file201.folders.rename');
    Route::patch('/file201/folders/{folder}/move', [File201Controller::class, 'moveFolder'])->name('file201.folders.move');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    // Face Recognition Attendance
    Route::post('/face/register', [FaceAttendanceController::class, 'registerFace'])->name('face.register');
    Route::post('/face/timein', [FaceAttendanceController::class, 'timeIn'])->name('face.timein');
    Route::post('/face/timeout', [FaceAttendanceController::class, 'timeOut'])->name('face.timeout');

    // WebAuthn Fingerprint
    Route::post('/webauthn/register/options', [WebAuthnRegisterController::class, 'options'])->name('webauthn.register.options');
    Route::post('/webauthn/register', [WebAuthnRegisterController::class, 'register'])->name('webauthn.register');

});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

\Illuminate\Support\Facades\Route::middleware(['auth', 'role:admin'])->post('admin/communication/group', [\App\Http\Controllers\Admin\CommunicationController::class, 'updateGroup'])->name('admin.communication.group');

\Illuminate\Support\Facades\Route::middleware(['auth', 'role:admin'])->group(function () {
    \Illuminate\Support\Facades\Route::post('admin/who/pin', [\App\Http\Controllers\Admin\ProfilePinController::class, 'verify'])->name('admin.who.pin');
    \Illuminate\Support\Facades\Route::post('admin/who/create', [\App\Http\Controllers\Admin\ProfilePinController::class, 'create'])->name('admin.who.create');
    \Illuminate\Support\Facades\Route::post('admin/who/reset', [\App\Http\Controllers\Admin\ProfilePinController::class, 'reset'])->name('admin.who.reset');
\Illuminate\Support\Facades\Route::post('admin/who/add', [\App\Http\Controllers\Admin\ProfilePinController::class, 'addAdmin'])->name('admin.who.add');
\Illuminate\Support\Facades\Route::post('admin/who/change', [\App\Http\Controllers\Admin\ProfilePinController::class, 'changePin'])->name('admin.who.change');

    \Illuminate\Support\Facades\Route::post('admin/who/clear', function () {
        session()->forget('admin_profile');
        return back();
    })->name('admin.who.clear');
});

\Illuminate\Support\Facades\Route::middleware('auth')->prefix('groupchat')->name('groupchat.')->group(function () {
    \Illuminate\Support\Facades\Route::post('send', [\App\Http\Controllers\GroupChatController::class, 'send'])->name('send');
    \Illuminate\Support\Facades\Route::post('read', [\App\Http\Controllers\GroupChatController::class, 'read'])->name('read');
    \Illuminate\Support\Facades\Route::get('attachment/{groupMessage}', [\App\Http\Controllers\GroupChatController::class, 'attachment'])->name('attachment');
});
