<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VolunteerController;
use App\Http\Controllers\Volunteer\ProfileController as VolunteerProfileController;
use App\Http\Controllers\Volunteer\AttendanceController;
use App\Http\Controllers\Volunteer\FaceAttendanceController;
use App\Http\Controllers\WebAuthn\WebAuthnRegisterController;
use App\Http\Controllers\WebAuthn\WebAuthnAttendanceController;
use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\AttendanceController as AdminAttendanceController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

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
        return Inertia::render('Admin/Dashboard', [
            'pendingCount'    => $pendingCount,
            'totalVolunteers' => $totalVolunteers,
            'activeToday'     => $activeToday,
        ]);
    })->name('dashboard');

    Route::get('/volunteers', [VolunteerController::class, 'index'])->name('volunteers');
    Route::patch('/volunteers/{id}/approve', [VolunteerController::class, 'approve'])->name('volunteers.approve');
    Route::patch('/volunteers/{id}/reject', [VolunteerController::class, 'reject'])->name('volunteers.reject');

    // Activities
    Route::get('/activities', [ActivityController::class, 'index'])->name('activities.index');
    Route::get('/activities/create', [ActivityController::class, 'create'])->name('activities.create');
    Route::post('/activities', [ActivityController::class, 'store'])->name('activities.store');
    Route::get('/activities/{activity}/edit', [ActivityController::class, 'edit'])->name('activities.edit');
    Route::patch('/activities/{activity}', [ActivityController::class, 'update'])->name('activities.update');
    Route::delete('/activities/{activity}', [ActivityController::class, 'destroy'])->name('activities.destroy');

    // Attendance
    Route::get('/attendance', [AdminAttendanceController::class, 'index'])->name('attendance.index');
    Route::get('/attendance/export-pdf', [AdminAttendanceController::class, 'exportPdf'])->name('attendance.export.pdf');
});

// Volunteer Routes
Route::middleware(['auth', 'role:volunteer'])->prefix('volunteer')->name('volunteer.')->group(function () {
    Route::get('/dashboard', function () {
        $user = auth()->user();
        $totalHours = \App\Models\Attendance::where('user_id', $user->id)->sum('hours_rendered');
        $totalDays = \App\Models\Attendance::where('user_id', $user->id)->count();
        $monthDays = \App\Models\Attendance::where('user_id', $user->id)
            ->whereMonth('date', now()->month)
            ->count();

        return Inertia::render('Volunteer/Dashboard', [
            'auth'       => ['user' => $user],
            'totalHours' => $totalHours,
            'totalDays'  => $totalDays,
            'monthDays'  => $monthDays,
        ]);
    })->name('dashboard');

    Route::get('/profile', [VolunteerProfileController::class, 'edit'])->name('profile');
    Route::patch('/profile', [VolunteerProfileController::class, 'update'])->name('profile.update');

    Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance');
    Route::post('/attendance/time-in', [AttendanceController::class, 'timeIn'])->name('attendance.timein');
    Route::post('/attendance/time-out', [AttendanceController::class, 'timeOut'])->name('attendance.timeout');

    // Face Recognition Attendance
    Route::post('/face/register', [FaceAttendanceController::class, 'registerFace'])->name('face.register');
    Route::post('/face/timein', [FaceAttendanceController::class, 'timeIn'])->name('face.timein');
    Route::post('/face/timeout', [FaceAttendanceController::class, 'timeOut'])->name('face.timeout');

    // WebAuthn Fingerprint (keeping for reference)
    Route::post('/webauthn/register/options', [WebAuthnRegisterController::class, 'options'])->name('webauthn.register.options');
    Route::post('/webauthn/register', [WebAuthnRegisterController::class, 'register'])->name('webauthn.register');
    Route::post('/webauthn/timein/options', [WebAuthnAttendanceController::class, 'options'])->name('webauthn.timein.options');
    Route::post('/webauthn/timein', [WebAuthnAttendanceController::class, 'timeIn'])->name('webauthn.timein');
    Route::post('/webauthn/timeout/options', [WebAuthnAttendanceController::class, 'options'])->name('webauthn.timeout.options');
    Route::post('/webauthn/timeout', [WebAuthnAttendanceController::class, 'timeOut'])->name('webauthn.timeout');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';