<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentReviewController extends Controller
{
    /**
     * List all volunteer compliance documents for admin review.
     * Access to this whole controller is already restricted to admins
     * by the 'role:admin' middleware on the admin route group.
     */
    public function index(Request $request)
    {
        $documents = Document::with(['user:id,name,badge_number', 'reviewer:id,name', 'documentRequest:id,document_name'])
            ->where('status', '!=', 'superseded')
            ->orderByRaw("FIELD(status, 'pending', 'needs_revision', 'approved', 'rejected')")
            ->orderBy('created_at', 'desc')
            ->get();

        $groupRows = $documents->whereNotNull('document_request_id')
            ->groupBy('document_request_id')
            ->map(function ($files, $requestId) {
                $first = $files->first();
                return [
                    'id'                   => 'group-' . $requestId,
                    'is_group'             => true,
                    'document_request_id'  => (int) $requestId,
                    'document_name'        => $first->documentRequest->document_name ?? 'Document Request',
                    'created_at'           => $files->max('created_at'),
                    'volunteer'            => [
                        'id'           => $first->user->id,
                        'name'         => $first->user->name,
                        'badge_number' => $first->user->badge_number,
                    ],
                    'files' => $files->map(fn ($d) => [
                        'id'             => $d->id,
                        'original_name'  => $d->original_name,
                        'status'         => $d->status,
                        'admin_remarks'  => $d->admin_remarks,
                        'created_at'     => $d->created_at,
                        'reviewed_at'    => $d->reviewed_at,
                        'reviewer'       => $d->reviewer ? ['id' => $d->reviewer->id, 'name' => $d->reviewer->name] : null,
                    ])->values(),
                ];
            })->values();

        $singleRows = $documents->whereNull('document_request_id')
            ->map(fn ($d) => [
                'id'             => $d->id,
                'is_group'       => false,
                'type'           => $d->type,
                'original_name'  => $d->original_name,
                'status'         => $d->status,
                'admin_remarks'  => $d->admin_remarks,
                'created_at'     => $d->created_at,
                'reviewed_at'    => $d->reviewed_at,
                'volunteer'      => [
                    'id'           => $d->user->id,
                    'name'         => $d->user->name,
                    'badge_number' => $d->user->badge_number,
                ],
                'reviewer' => $d->reviewer ? [
                    'id'   => $d->reviewer->id,
                    'name' => $d->reviewer->name,
                ] : null,
            ])->values();

        $rows = $groupRows->concat($singleRows)
            ->sortByDesc('created_at')
            ->values();

        return Inertia::render('Admin/DocumentReview', [
            'documents' => $rows,
        ]);
    }

    public function approve(Request $request, Document $document)
    {
        $document->update([
            'status'        => 'approved',
            'admin_remarks' => null,
            'reviewed_by'   => $request->user()->id,
            'reviewed_at'   => now(),
        ]);

        $documentRequest = $document->documentRequest;

        \App\Models\VolunteerDocument::create([
            'user_id'              => $document->user_id,
            'document_request_id'  => $documentRequest->id ?? null,
            'name'                 => $documentRequest->document_name ?? $document->original_name,
            'original_name'        => $document->original_name,
            'type'                 => $document->type,
            'path'                 => $document->file_path,
        ]);

        $this->syncDocumentRequestStatus($documentRequest);

        \App\Models\Notification::create([
            'user_id'      => $document->user_id,
            'category'     => 'system',
            'title'        => 'Document Approved',
            'message'      => "Your {$document->type} has been approved.",
            'action_label' => 'View documents',
            'action_url'   => route('volunteer.file201'),
        ]);

        return back()->with('success', 'Document approved.');
    }

    public function needsRevision(Request $request, Document $document)
    {
        $data = $request->validate([
            'remarks' => ['required', 'string', 'max:1000'],
        ]);

        $document->update([
            'status'        => 'needs_revision',
            'admin_remarks' => $data['remarks'],
            'reviewed_by'   => $request->user()->id,
            'reviewed_at'   => now(),
        ]);

        // Remove the approved copy (the stored file stays, since the upload still uses it).
        if ($document->file_path) {
            \App\Models\VolunteerDocument::where('user_id', $document->user_id)
                ->where('path', $document->file_path)
                ->delete();
        }

        $this->syncDocumentRequestStatus($document->documentRequest, $data['remarks']);

        \App\Models\Notification::create([
            'user_id'      => $document->user_id,
            'category'     => 'system',
            'title'        => 'Document Needs Revision',
            'message'      => "Your {$document->type} requires revision: {$data['remarks']}",
            'action_label' => 'Submit revision',
            'action_url'   => route('volunteer.file201'),
        ]);

        return back()->with('success', 'Marked as needing revision.');
    }

    public function reject(Request $request, Document $document)
    {
        $data = $request->validate([
            'remarks' => ['required', 'string', 'max:1000'],
        ]);

        $document->update([
            'status'        => 'rejected',
            'admin_remarks' => $data['remarks'],
            'reviewed_by'   => $request->user()->id,
            'reviewed_at'   => now(),
        ]);

        // Remove the approved copy (the stored file stays, since the upload still uses it).
        if ($document->file_path) {
            \App\Models\VolunteerDocument::where('user_id', $document->user_id)
                ->where('path', $document->file_path)
                ->delete();
        }

        $this->syncDocumentRequestStatus($document->documentRequest, $data['remarks']);

        \App\Models\Notification::create([
            'user_id'      => $document->user_id,
            'category'     => 'system',
            'title'        => 'Document Rejected',
            'message'      => "Your {$document->type} was rejected: {$data['remarks']}",
            'action_label' => 'View documents',
            'action_url'   => route('volunteer.file201'),
        ]);

        return back()->with('success', 'Document rejected.');
    }

    /**
     * Recompute a DocumentRequest's overall status from the current status of
     * every file uploaded against it, and save the admin's remarks up onto the
     * request itself so the volunteer's "Document Requests" table (which reads
     * from the request, not the individual file) reflects it.
     *
     * Priority: any rejected file -> rejected; else any needing revision ->
     * needs_revision; else all approved -> approved; else -> submitted.
     */
    private function syncDocumentRequestStatus($documentRequest, ?string $remarks = null): void
    {
        if (!$documentRequest) {
            return;
        }

        $statuses = $documentRequest->uploads()->pluck('status');

        if ($statuses->isEmpty()) {
            return;
        }

        if ($statuses->contains('rejected')) {
            $newStatus = 'rejected';
        } elseif ($statuses->contains('needs_revision')) {
            $newStatus = 'needs_revision';
        } elseif ($statuses->every(fn ($s) => $s === 'approved')) {
            $newStatus = 'approved';
        } else {
            $newStatus = 'submitted';
        }

        $update = ['status' => $newStatus];

        if (in_array($newStatus, ['rejected', 'needs_revision'], true) && $remarks !== null) {
            $update['admin_remarks'] = $remarks;
        } elseif ($newStatus === 'approved') {
            $update['admin_remarks'] = null;
        }

        $documentRequest->update($update);
    }

    /**
     * Admin can view/download any volunteer's document — no ownership check,
     * since access to this whole controller is already gated to admins only.
     */
    public function view(Document $document)
    {
        abort_unless($document->file_path && Storage::disk('local')->exists($document->file_path), 404);

        return Storage::disk('local')->response($document->file_path, $document->original_name);
    }

    public function download(Document $document)
    {
        abort_unless($document->file_path && Storage::disk('local')->exists($document->file_path), 404);

        return Storage::disk('local')->download($document->file_path, $document->original_name);
    }
}
