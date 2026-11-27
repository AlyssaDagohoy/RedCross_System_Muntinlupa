<?php

namespace App\Http\Controllers;

use App\Mail\VolunteerApproved;
use App\Mail\VolunteerRejected;
use App\Mail\VolunteerRemoved;
use App\Models\User;
use App\Models\DocumentRequest;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class VolunteerController extends Controller
{
    // Show all volunteers (for admin)
    public function index()
    {
        $requiredTypes = ['nbi', 'medical', 'training', 'barangay'];

        $volunteers = User::role('volunteer')
            ->select(array_values(array_intersect(Schema::getColumnListing('users'), ['id', 'badge_number', 'name', 'email', 'status', 'created_at', 'biometric_id', 'phone', 'address', 'birthdate', 'gender', 'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone'])))
            ->orderBy('created_at', 'desc')
            ->get();

        // How many of the required document types each volunteer has submitted
        $docCounts = DB::table('documents')
            ->select('user_id', DB::raw('COUNT(DISTINCT type) as total'))
            ->whereIn('type', $requiredTypes)
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        // Total rendered hours per volunteer
        $hours = DB::table('attendances')
            ->select('user_id', DB::raw('SUM(hours_rendered) as total'))
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        // Every submitted document per volunteer (superseded ones skipped) so the admin can check them before approving
        $docsByUser = \App\Models\Document::with('documentRequest:id,document_name')
            ->whereIn('user_id', $volunteers->pluck('id'))
            ->where('status', '!=', 'superseded')
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('user_id');

        $volunteers->each(function ($v) use ($docCounts, $hours, $requiredTypes, $docsByUser) {
            $v->submitted_docs = ($docsByUser[$v->id] ?? collect())->map(fn ($d) => [
                'id'            => $d->id,
                'type'          => $d->type,
                'label'         => $d->documentRequest->document_name ?? null,
                'original_name' => $d->original_name,
                'status'        => $d->status,
                'admin_remarks' => $d->admin_remarks,
                'is_requested'  => (bool) $d->document_request_id,
            ])->values();
            $v->documents_submitted = (int) ($docCounts[$v->id] ?? 0);
            $v->documents_required  = count($requiredTypes);
            $bd = $v->getAttributes()['birthdate'] ?? null;
            $v->birth_label = $bd ? \Carbon\Carbon::parse($bd)->format('F j, Y') : null;
            $v->total_hours         = round((float) ($hours[$v->id] ?? 0), 1);
        });

        return Inertia::render('Admin/Volunteers', [
            'volunteers' => $volunteers,
        ]);
    }

    // Approve a volunteer
    public function approve($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'approved';

        // Generate Volunteer ID once; keep the existing one on re-approval
        if (empty($user->badge_number)) {
            $user->badge_number = 'PRC-' . str_pad($user->id, 5, '0', STR_PAD_LEFT);
        }

        $user->save();

        // Send approval email
        try {
            Mail::to($user->email)->send(new VolunteerApproved($user));
        } catch (\Exception $e) {
            \Log::error('Failed to send approval email: ' . $e->getMessage());
        }

        return back()->with('success', "Volunteer approved (ID: {$user->badge_number}) and notified via email.");
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

    // Remove a volunteer: email them, end their sessions, then soft delete the account
    public function destroy($id)
    {
        $user = User::role('volunteer')->findOrFail($id);

        $emailed = true;
        try {
            Mail::to($user->email)->send(new VolunteerRemoved($user));
        } catch (\Exception $e) {
            $emailed = false;
            \Log::error('Failed to send removal email: ' . $e->getMessage());
        }

        // Log out anyone still signed in with this account
        DB::table('sessions')->where('user_id', $user->id)->delete();

        $user->delete();

        return back()->with('success', $emailed
            ? "{$user->name} was removed and notified via email."
            : "{$user->name} was removed, but the email could not be sent.");
    }

    // Admin requests one or more documents from a volunteer, grouped as a batch
    public function requestDocument(Request $request, $id)
    {
        $data = $request->validate([
            'document_name' => ['required', 'string', 'max:255'],
            'instructions'  => ['nullable', 'string', 'max:1000'],
            'due_date'      => ['nullable', 'date'],
        ]);

        $names = array_filter(array_map('trim', preg_split('/[,;\n]+/', $data['document_name'])), fn ($n) => $n !== '');
        $maxFiles = max(1, count($names));
        if ($maxFiles > 10) {
            return back()->withErrors(['document_name' => 'Hanggang 10 files lang ang pwedeng hilingin (paghiwalayin ng comma).']);
        }

        $volunteer = User::findOrFail($id);

        DocumentRequest::create([
            'user_id'       => $volunteer->id,
            'requested_by'  => $request->user()->id,
            'document_name' => $data['document_name'],
            'instructions'  => $data['instructions'] ?? null,
            'due_date'      => $data['due_date'] ?? null,
            'max_files'     => $maxFiles,
            'status'        => 'pending_submission',
        ]);

        Notification::create([
            'user_id'      => $volunteer->id,
            'category'     => 'system',
            'title'        => 'Document Requested',
            'message'      => "An administrator requested: {$data['document_name']}.",
            'action_label' => 'View documents',
            'action_url'   => route('volunteer.file201'),
        ]);

        return back()->with('success', 'Document request sent to volunteer.');
    }
}