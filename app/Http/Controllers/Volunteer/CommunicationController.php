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
            ->with('messages')
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

        return Inertia::render('Volunteer/Communication', [
            'sentEmails' => $sentEmails,
            'announcements' => \App\Models\Announcement::latest()->take(10)->get(),
        ]);
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'to' => 'required|email',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $thread = SentEmail::create([
            'user_id' => $request->user()->id,
            ...$validated,
        ]);

        $thread->messages()->create([
            'sender_type' => 'volunteer',
            'body' => $validated['message'],
        ]);

        Mail::to($validated['to'])->send(
            new VolunteerMessageMail(
                senderName: $request->user()->name,
                subjectLine: $validated['subject'],
                body: $validated['message'],
            )
        );

        return back();
    }

    public function reply(Request $request, SentEmail $email)
    {
        abort_unless($email->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'body' => 'required|string',
        ]);

        $email->messages()->create([
            'sender_type' => 'volunteer',
            'body' => $validated['body'],
        ]);

        $email->update(['sent_status' => 'active']);

        Mail::to($email->to)->send(
            new VolunteerMessageMail(
                senderName: $request->user()->name,
                subjectLine: 'Re: ' . $email->subject,
                body: $validated['body'],
            )
        );

        return back();
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