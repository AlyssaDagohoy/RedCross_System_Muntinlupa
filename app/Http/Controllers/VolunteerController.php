<?php

namespace App\Http\Controllers;

use App\Mail\VolunteerApproved;
use App\Mail\VolunteerRejected;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class VolunteerController extends Controller
{
    // Show all volunteers (for admin)
    public function index()
    {
        $volunteers = User::role('volunteer')
            ->select('id', 'name', 'email', 'status', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Volunteers', [
            'volunteers' => $volunteers,
        ]);
    }

    // Approve a volunteer
    public function approve($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'approved';
        $user->save();

        // Send approval email
        try {
            Mail::to($user->email)->send(new VolunteerApproved($user));
        } catch (\Exception $e) {
            \Log::error('Failed to send approval email: ' . $e->getMessage());
        }

        return back()->with('success', 'Volunteer approved and notified via email.');
    }

    // Reject a volunteer
    public function reject($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'rejected';
        $user->save();

        // Send rejection email
        try {
            Mail::to($user->email)->send(new VolunteerRejected($user));
        } catch (\Exception $e) {
            \Log::error('Failed to send rejection email: ' . $e->getMessage());
        }

        return back()->with('success', 'Volunteer rejected and notified via email.');
    }
}