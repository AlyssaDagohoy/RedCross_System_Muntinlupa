<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\SentEmail;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CommunicationController extends Controller
{
    public function index()
    {
        $messages = SentEmail::with('user', 'messages')
            ->orderBy('created_at', 'desc')
            ->get();

        $announcements = Announcement::with('admin')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Communication', [
            'messages'      => $messages,
            'announcements' => $announcements,
        ]);
    }

    public function reply(Request $request, SentEmail $sentEmail)
    {
        $request->validate([
            'reply' => 'required|string',
        ]);

        // Kept for backward compatibility with anything still reading the
        // single reply/replied_at columns.
        $sentEmail->update([
            'reply'      => $request->reply,
            'replied_at' => now(),
        ]);

        // This is the part that actually makes it show up in the volunteer's
        // Inbox — the volunteer side reads from communication_messages now,
        // not from the reply column above.
        $sentEmail->messages()->create([
            'sender_type' => 'admin',
            'body'        => $request->reply,
        ]);

        // Re-activate the inbox side in case the volunteer had archived/trashed
        // this thread — a fresh reply should bring it back into view.
        $sentEmail->update(['inbox_status' => 'active']);

        return back()->with('success', 'Reply sent!');
    }

    public function announce(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string',
        ]);

        Announcement::create([
            'admin_id' => auth()->id(),
            'title'    => $request->title,
            'body'     => $request->body,
        ]);

        return back()->with('success', 'Announcement posted!');
    }

    public function deleteAnnouncement(Announcement $announcement)
    {
        $announcement->delete();
        return back()->with('success', 'Announcement deleted!');
    }
}
