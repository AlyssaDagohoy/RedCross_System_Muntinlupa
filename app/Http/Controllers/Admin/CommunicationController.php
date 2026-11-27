<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\VolunteerMessageMail;
use App\Models\Announcement;
use App\Models\Notification;
use App\Models\SentEmail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CommunicationController extends Controller
{
    public function index()
    {
        $messages = SentEmail::with('user', 'messages.admin')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($t) {
                $hasReply = $t->messages->where('sender_type', 'admin')->isNotEmpty() || filled($t->reply);
                $lastVol  = $t->messages->where('sender_type', 'volunteer')->last();
                $ref      = $lastVol?->created_at ?? $t->created_at;

                $t->has_admin_reply = $hasReply;
                $t->admin_unread    = ! $t->admin_read_at || ($ref && $t->admin_read_at->lt($ref));

                return $t;
            })
            ->filter(fn ($t) => $t->admin_inbox_status !== 'purged'
                || ($t->has_admin_reply && $t->admin_sent_status !== 'purged'))
            ->values();

        $announcements = Announcement::withTrashed()->with('admin')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render(request()->boolean('classic') ? 'Admin/Communication' : 'Admin/Chat', [
            'messages'      => $messages,
            'announcements' => $announcements,
            'staff'         => \App\Support\AdminStaff::all(),
            'groupChat'     => array_merge(\App\Support\ChatGroup::get(), \App\Support\ChatGroup::feed()),
            'volunteers'    => User::where('status', 'approved')->orderBy('name')->get()->reject(fn ($u) => $u->hasAnyRole(['admin', 'Admin']))->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])->values(),
        ]);
    }

    public function reply(Request $request, SentEmail $sentEmail)
    {
        $request->validate([
            'reply' => 'nullable|string|required_without:attachment',
            'attachment' => \App\Support\ChatAttachment::rules(),
            'admin_label' => 'nullable|string|max:60',
        ]);

        $att = \App\Support\ChatAttachment::store($request->file('attachment'));

        // Kept for backward compatibility with anything still reading the
        // single reply/replied_at columns.
        $sentEmail->update([
            'reply'      => filled($request->reply) ? $request->reply : 'Sent an attachment',
            'replied_at' => now(),
        ]);

        // This is what shows up in the volunteer's Inbox.
        $sentEmail->messages()->create([
            'admin_id'    => auth()->id(),
            'admin_label' => $this->resolveLabel($sentEmail->chat_key, $request->admin_label),
            'sender_type' => 'admin',
            'body'        => (string) $request->reply,
            ...$att,
        ]);

        // Bring the thread back into view on both sides.
        $sentEmail->update([
            'inbox_status'       => 'active',
            'admin_inbox_status' => 'active',
            'admin_sent_status'  => 'active',
            'admin_read_at'      => now(),
        ]);

        try {
            if ($sentEmail->user_id) {
                $title = $sentEmail->chat_key
                    ? 'New message from Admin ' . $sentEmail->chat_key
                    : 'New message in ' . (\App\Support\ChatGroup::get()['name'] ?? 'Group chat');

                Notification::create([
                    'user_id'      => $sentEmail->user_id,
                    'category'     => 'system',
                    'title'        => $title,
                    'message'      => filled($request->reply)
                        ? \Illuminate\Support\Str::limit($request->reply, 120)
                        : 'Sent you an attachment',
                    'action_label' => 'Open messages',
                    'action_url'   => route('volunteer.communication'),
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Reply notification failed for thread ' . $sentEmail->id . ': ' . $e->getMessage());
        }

        return back()->with('success', 'Reply sent!');
    }

    /** Staff name from config/staff.php that matches the given text, or null. */
    private function cleanKey(?string $key): ?string
    {
        $key = trim((string) $key);
        $own = trim((string) (auth()->user()->name ?? ''));
        if ($own !== '' && strcasecmp($own, $key) === 0) {
            return $own;
        }
        foreach (\App\Support\AdminStaff::all() as $s) {
            if (strcasecmp($s, $key) === 0) {
                return $s;
            }
        }

        return null;
    }

    /** Private chats always show the chat owner's name; the team chat uses the chosen name. */
    private function resolveLabel(?string $chatKey, ?string $typed): ?string
    {
        if (filled($chatKey)) {
            return 'Admin ' . $chatKey;
        }
        $name = trim(preg_replace('/^admin\s+/i', '', (string) $typed));
        if ($name === '') {
            return null;
        }

        return Str::limit('Admin ' . ($this->cleanKey($name) ?? $name), 60, '');
    }

    /** Fix the name shown on a message the admin already sent. */
    public function relabel(Request $request, \App\Models\CommunicationMessage $message)
    {
        abort_unless($message->sender_type === 'admin', 403);
        $data = $request->validate(['admin_label' => 'required|string|max:60']);
        $message->update(['admin_label' => Str::limit(trim($data['admin_label']), 60, '')]);

        return back()->with('success', 'Name updated.');
    }
    public function attachment(\App\Models\CommunicationMessage $message)
    {
        return \App\Support\ChatAttachment::response($message);
    }

    public function markRead(Request $request)
    {
        $ids  = $request->validate(['ids' => 'required|array'])['ids'];
        $read = $request->boolean('read', true);

        SentEmail::whereIn('id', $ids)->update(['admin_read_at' => $read ? now() : null]);

        return back();
    }

    public function toggleStar(SentEmail $sentEmail)
    {
        $sentEmail->update(['admin_starred_at' => $sentEmail->admin_starred_at ? null : now()]);

        return back();
    }

    public function archive(Request $request)
    {
        return $this->setBox($request, 'archived');
    }

    public function trash(Request $request)
    {
        return $this->setBox($request, 'trashed');
    }

    public function restore(Request $request)
    {
        return $this->setBox($request, 'active');
    }

    public function purge(Request $request)
    {
        abort_unless(auth()->user() && auth()->user()->hasRole('super-admin'), 403);
        return $this->setBox($request, 'purged');
    }

    private function setBox(Request $request, string $status)
    {
        $data = $request->validate([
            'ids' => 'required|array',
            'box' => 'required|in:inbox,sent',
        ]);

        SentEmail::whereIn('id', $data['ids'])
            ->update(['admin_' . $data['box'] . '_status' => $status]);

        // A thread nobody replied to has no Sent copy, so purging it from the
        // inbox removes it completely.
        if ($status === 'purged' && $data['box'] === 'inbox') {
            SentEmail::whereIn('id', $data['ids'])
                ->whereNull('reply')
                ->whereDoesntHave('messages', fn ($q) => $q->where('sender_type', 'admin'))
                ->update(['admin_sent_status' => 'purged']);
        }

        return back();
    }

    /** Admin starts a new conversation with a volunteer (admin sends the first message). */
    public function start(Request $request)
    {
        $data = $request->validate([
            'user_id'     => 'required|exists:users,id',
            'message'     => 'required|string|max:5000',
            'subject'     => 'nullable|string|max:255',
            'chat_key'    => 'nullable|string|max:60',
            'admin_label' => 'nullable|string|max:60',
        ]);

        $volunteer = User::findOrFail($data['user_id']);
        abort_if($volunteer->hasAnyRole(['admin', 'Admin']), 403);

        $thread = SentEmail::create([
            'user_id'       => $volunteer->id,
            'chat_key'      => $this->cleanKey($data['chat_key'] ?? null),
            'to'            => (string) $volunteer->email,
            'subject'       => filled($data['subject'] ?? null) ? $data['subject'] : 'Message from Red Cross',
            'message'       => '',
            'reply'         => $data['message'],
            'replied_at'    => now(),
            'admin_read_at' => now(),
        ]);

        $thread->messages()->create([
            'admin_id'    => auth()->id(),
            'admin_label' => $this->resolveLabel($thread->chat_key, $data['admin_label'] ?? null),
            'sender_type' => 'admin',
            'body'        => $data['message'],
        ]);

        try {
            Notification::create([
                'user_id'      => $volunteer->id,
                'category'     => 'system',
                'title'        => 'New message from Red Cross',
                'message'      => Str::limit($data['message'], 120),
                'action_label' => 'Open messages',
                'action_url'   => route('volunteer.communication'),
            ]);
        } catch (\Throwable $e) {
            Log::warning('New message notification failed for user ' . $volunteer->id . ': ' . $e->getMessage());
        }

        return back()->with('success', 'Message sent to ' . $volunteer->name . '.');
    }
    public function updateGroup(Request $request)
    {
        $data = $request->validate([
            'name'    => 'required|string|max:60',
            'picture' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        \App\Support\ChatGroup::set('group_name', trim($data['name']));

        if ($request->hasFile('picture')) {
            $old = \Illuminate\Support\Facades\DB::table('chat_settings')->where('name', 'group_picture')->value('value');
            $path = $request->file('picture')->store('chat-group', 'public');
            \App\Support\ChatGroup::set('group_picture', $path);
            if ($old) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
            }
        }

        return back()->with('success', 'Group chat updated.');
    }

    public function announce(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string',
        ]);

        $announcement = Announcement::create([
            'admin_id' => auth()->id(),
            'title'    => $request->title,
            'body'     => $request->body,
        ]);

        @set_time_limit(180);

        // Every approved volunteer (admins are skipped).
        $volunteers = User::where('status', 'approved')
            ->get()
            ->reject(fn ($u) => $u->hasAnyRole(['admin', 'Admin']));

        $notified = 0;
        $emailed  = 0;

        foreach ($volunteers as $volunteer) {
            // 1) Portal notification (bell + Notifications page)
            try {
                Notification::create([
                    'user_id'      => $volunteer->id,
                    'category'     => 'system',
                    'title'        => $announcement->title,
                    'message'      => Str::limit($announcement->body, 200),
                    'action_label' => 'Read announcement',
                    'action_url'   => route('volunteer.communication'),
                ]);
                $notified++;
            } catch (\Throwable $e) {
                Log::warning('Announcement notification failed for user ' . $volunteer->id . ': ' . $e->getMessage());
            }

            // 2) Email (one failure never blocks the others)
            if (filled($volunteer->email)) {
                try {
                    Mail::to($volunteer->email)->send(new VolunteerMessageMail(
                        'PRC Admin',
                        'Announcement: ' . $announcement->title,
                        $announcement->title . "\n\n" . $announcement->body
                    ));
                    $emailed++;
                } catch (\Throwable $e) {
                    Log::warning('Announcement email failed for ' . $volunteer->email . ': ' . $e->getMessage());
                }
            }
        }

        return back()->with('success', "Announcement posted! {$notified} notified, {$emailed} emailed.");
    }

    public function updateAnnouncement(Request $request, Announcement $announcement)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string',
        ]);

        $announcement->update($data);

        return back()->with('success', 'Announcement updated!');
    }

    public function pinAnnouncement(Announcement $announcement)
    {
        $announcement->update(['pinned_at' => $announcement->pinned_at ? null : now()]);

        return back();
    }

    public function archiveAnnouncement(Announcement $announcement)
    {
        if ($announcement->archived_at) {
            $announcement->update(['archived_at' => null]);
        } else {
            $announcement->update(['archived_at' => now(), 'pinned_at' => null]);
        }

        return back();
    }

    public function restoreAnnouncement($id)
    {
        $announcement = Announcement::onlyTrashed()->findOrFail($id);
        $announcement->restore();
        $announcement->update(['archived_at' => null]);

        return back()->with('success', 'Announcement restored!');
    }

    public function purgeAnnouncement($id)
    {
        abort_unless(auth()->user() && auth()->user()->hasRole('super-admin'), 403);
        Announcement::onlyTrashed()->findOrFail($id)->forceDelete();

        return back()->with('success', 'Announcement deleted forever!');
    }

    public function deleteAnnouncement(Announcement $announcement)
    {
        $announcement->delete();
        return back()->with('success', 'Announcement deleted!');
    }
}