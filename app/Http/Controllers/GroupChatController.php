<?php

namespace App\Http\Controllers;

use App\Models\GroupMessage;
use App\Support\ChatAttachment;
use App\Support\ChatGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GroupChatController extends Controller
{
    /** Admins and approved volunteers only. Returns true when the user is an admin. */
    private function member(Request $request): bool
    {
        $user = $request->user();
        abort_unless($user, 403);

        if ($user->hasAnyRole(['admin', 'Admin'])) {
            return true;
        }

        abort_unless($user->hasRole('volunteer') && ($user->status ?? 'approved') === 'approved', 403);

        return false;
    }

    public function send(Request $request)
    {
        $isAdmin = $this->member($request);

        $data = $request->validate([
            'body'        => 'nullable|string|max:5000|required_without:attachment',
            'attachment'  => ChatAttachment::rules(),
            'admin_label' => 'nullable|string|max:60',
        ]);

        if ($isAdmin) {
            $name = trim(preg_replace('/^admin\s+/i', '', (string) ($data['admin_label'] ?? '')));
            if ($name === '') {
                throw ValidationException::withMessages(['admin_label' => 'Choose your name in "Replying as" first.']);
            }
            $label = Str::limit('Admin ' . $name, 60, '');
        } else {
            $label = Str::limit((string) $request->user()->name, 80, '');
        }

        GroupMessage::create([
            'user_id'     => $isAdmin ? null : $request->user()->id,
            'sender_type' => $isAdmin ? 'admin' : 'volunteer',
            'label'       => $label,
            'body'        => (string) ($data['body'] ?? ''),
            ...ChatAttachment::store($request->file('attachment')),
        ]);

        return back();
    }

    public function read(Request $request)
    {
        $this->member($request);

        DB::table('group_reads')->updateOrInsert(
            ['reader' => ChatGroup::reader()],
            ['read_at' => now()]
        );

        return back();
    }

    public function attachment(Request $request, GroupMessage $groupMessage)
    {
        $this->member($request);

        $disk = Storage::disk('local');
        abort_unless($groupMessage->attachment_path && $disk->exists($groupMessage->attachment_path), 404);

        return response()->file($disk->path($groupMessage->attachment_path), [
            'Content-Type'           => $groupMessage->attachment_mime ?: 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}