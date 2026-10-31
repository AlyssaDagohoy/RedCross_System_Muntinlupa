<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ChatGroup
{
    public const DEFAULT_NAME = 'Group chat';

    public static function get(): array
    {
        $name = self::DEFAULT_NAME;
        $picture = null;

        try {
            if (Schema::hasTable('chat_settings')) {
                $rows = DB::table('chat_settings')->whereIn('name', ['group_name', 'group_picture'])->pluck('value', 'name');
                if (filled($rows['group_name'] ?? null)) {
                    $name = $rows['group_name'];
                }
                if (filled($rows['group_picture'] ?? null)) {
                    $picture = '/storage/' . $rows['group_picture'];
                }
            }
        } catch (\Throwable $e) {
        }

        return ['name' => $name, 'picture' => $picture];
    }

    /** Who is reading: each volunteer and each admin profile has their own "last read" time. */
    public static function reader(): string
    {
        $u = auth()->user();
        if (! $u) {
            return '';
        }

        return $u->hasAnyRole(['admin', 'Admin'])
            ? 'a:' . (session('admin_profile') ?: 'shared')
            : 'v:' . $u->id;
    }

    /** Shared group chat messages (newest 1500) plus this reader's last read time. */
    public static function feed(): array
    {
        try {
            if (! Schema::hasTable('group_messages')) {
                return ['messages' => [], 'readAt' => null];
            }

            $messages = \App\Models\GroupMessage::orderByDesc('id')->limit(1500)->get()->reverse()->values()
                ->map(fn ($m) => [
                    'id'              => $m->id,
                    'user_id'         => $m->user_id,
                    'sender_type'     => $m->sender_type,
                    'label'           => $m->label,
                    'admin_label'     => $m->sender_type === 'admin' ? $m->label : null,
                    'body'            => $m->body,
                    'attachment_path' => $m->attachment_path ? '1' : null,
                    'attachment_name' => $m->attachment_name,
                    'attachment_mime' => $m->attachment_mime,
                    'created_at'      => $m->created_at?->toJSON(),
                ])->all();

            $read = DB::table('group_reads')->where('reader', self::reader())->value('read_at');

            return ['messages' => $messages, 'readAt' => $read ? \Carbon\Carbon::parse($read)->toJSON() : null];
        } catch (\Throwable $e) {
            return ['messages' => [], 'readAt' => null];
        }
    }

    public static function set(string $name, ?string $value): void
    {
        DB::table('chat_settings')->updateOrInsert(['name' => $name], ['value' => $value]);
    }
}