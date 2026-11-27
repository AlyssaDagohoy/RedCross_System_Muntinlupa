<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Mail\VolunteerMessageMail;
use App\Models\SentEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class CommunicationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $sentEmails = SentEmail::where('user_id', $user->id)
            ->where(function ($q) {
                $q->where('sent_status', '!=', 'purged')
                  ->orWhere('inbox_status', '!=', 'purged');
            })
            ->with('messages.admin:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($thread) {
                $lastAdminMessage = $thread->messages->where('sender_type', 'admin')->last();
                $thread->has_admin_message = (bool) $lastAdminMessage;
                $thread->unread = $lastAdminMessage
                    ? (! $thread->read_at || $thread->read_at->lt($lastAdminMessage->created_at))
                    : false;
                return $thread;
            });

        return Inertia::render(request()->boolean('classic') ? 'Volunteer/Communication' : 'Volunteer/Chat', [
            'sentEmails' => $sentEmails,
            'announcements' => \App\Models\Announcement::whereNull('archived_at')->orderByRaw('pinned_at IS NULL')->latest()->take(10)->get(), 'staff' => \App\Support\AdminStaff::all(), 'groupChat' => array_merge(\App\Support\ChatGroup::get(), \App\Support\ChatGroup::feed()),
        ]);
    }

    public function announcements(Request $request)
    {
        return Inertia::render('Volunteer/Announcements', [
            'announcements' => \App\Models\Announcement::with('admin:id,name')
                ->whereNull('archived_at')
                ->orderByRaw('pinned_at IS NULL')
                ->latest()
                ->take(30)
                ->get(),
        ]);
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'to' => 'required|email',
            'subject' => 'required|string|max:255',
            'message' => 'nullable|string|required_without:attachment', 'chat_key' => 'nullable|string|max:60',
            'attachment' => \App\Support\ChatAttachment::rules(),
        ]);

        $thread = SentEmail::create([
            'user_id' => $request->user()->id,
            'chat_key' => collect(\App\Support\AdminStaff::all())->first(fn ($s) => strcasecmp($s, trim((string) ($validated['chat_key'] ?? ''))) === 0), ...collect($validated)->except(['attachment', 'chat_key'])->put('message', $validated['message'] ?? 'Sent an attachment')->all(),
        ]);

        $thread->messages()->create([
            'sender_type' => 'volunteer',
            'body' => (string) ($validated['message'] ?? ''),
            ...\App\Support\ChatAttachment::store($request->file('attachment')),
        ]);

        Mail::to($validated['to'])->send(
            new VolunteerMessageMail(
                senderName: $request->user()->name,
                subjectLine: $validated['subject'],
                body: $validated['message'] ?? 'Sent an attachment',
            )
        );

        return back();
    }

    public function reply(Request $request, SentEmail $email)
    {
        abort_unless($email->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'body' => 'nullable|string|required_without:attachment',
            'attachment' => \App\Support\ChatAttachment::rules(),
        ]);

        $email->messages()->create([
            'sender_type' => 'volunteer',
            'body' => (string) ($validated['body'] ?? ''),
            ...\App\Support\ChatAttachment::store($request->file('attachment')),
        ]);

        $email->update(['sent_status' => 'active', 'admin_inbox_status' => 'active']);

        $mailTo = $email->to;
        $mailName = $request->user()->name;
        $mailSubject = 'Re: ' . $email->subject;
        $mailBody = $validated['body'] ?? 'Sent an attachment';
        dispatch(function () use ($mailTo, $mailName, $mailSubject, $mailBody) {
            try {
                \Illuminate\Support\Facades\Mail::to($mailTo)->send(new \App\Mail\VolunteerMessageMail(senderName: $mailName, subjectLine: $mailSubject, body: $mailBody));
            } catch (\Throwable $e) {
                \Log::warning('Volunteer reply mail failed: ' . $e->getMessage());
            }
        })->afterResponse();

        return back();
    }

    public function attachment(Request $request, \App\Models\CommunicationMessage $message)
    {
        abort_unless($message->thread && $message->thread->user_id === $request->user()->id, 403);

        return \App\Support\ChatAttachment::response($message);
    }

    public function markRead(Request $request)
    {
        $ids = $request->validate(['ids' => 'required|array'])['ids'];
        $read = $request->boolean('read', true);

        SentEmail::where('user_id', $request->user()->id)
            ->whereIn('id', $ids)
            ->update(['read_at' => $read ? now() : null]);

        return back();
    }

    public function toggleStar(Request $request, SentEmail $email)
    {
        abort_unless($email->user_id === $request->user()->id, 403);
        $email->update(['starred_at' => $email->starred_at ? null : now()]);

        return back();
    }

    public function archive(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array',
            'box' => 'required|in:inbox,sent',
        ]);
        $column = $data['box'] . '_status';

        SentEmail::where('user_id', $request->user()->id)
            ->whereIn('id', $data['ids'])
            ->update([$column => 'archived']);

        return back();
    }

    public function trash(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array',
            'box' => 'required|in:inbox,sent',
        ]);
        $column = $data['box'] . '_status';

        SentEmail::where('user_id', $request->user()->id)
            ->whereIn('id', $data['ids'])
            ->update([$column => 'trashed']);

        return back();
    }

    public function restore(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array',
            'box' => 'required|in:inbox,sent',
        ]);
        $column = $data['box'] . '_status';

        SentEmail::where('user_id', $request->user()->id)
            ->whereIn('id', $data['ids'])
            ->update([$column => 'active']);

        return back();
    }

    public function purge(Request $request)
    {
        $data = $request->validate([
            'ids' => 'required|array',
            'box' => 'required|in:inbox,sent',
        ]);
        $column = $data['box'] . '_status';

        SentEmail::where('user_id', $request->user()->id)
            ->whereIn('id', $data['ids'])
            ->update([$column => 'purged']);

        SentEmail::where('user_id', $request->user()->id)
            ->whereIn('id', $data['ids'])
            ->where('sent_status', 'purged')
            ->where(function ($q) {
                $q->where('inbox_status', 'purged')->orWhereNull('reply');
            })
            ->delete();

        return back();
    }
}