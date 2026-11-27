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

            $me = self::reader();
            $readRows = DB::table('group_reads')->whereNotNull('read_at')->where('reader', '!=', $me)->get(['reader', 'read_at']);
            $volIds = $readRows->filter(fn ($r) => str_starts_with($r->reader, 'v:'))->map(fn ($r) => (int) substr($r->reader, 2))->all();
            $volUsers = $volIds ? \App\Models\User::whereIn('id', $volIds)->get(['id', 'name', 'photo'])->keyBy('id') : collect();
            $readers = $readRows->map(function ($r) use ($volUsers) {
                $isVol = str_starts_with($r->reader, 'v:');
                $u = $isVol ? $volUsers->get((int) substr($r->reader, 2)) : null;
                $rest = trim((string) substr($r->reader, 2));
                $name = $isVol ? ($u->name ?? 'Volunteer') : ($rest === '' || $rest === 'shared' ? 'Admin' : 'Admin ' . $rest);
                return [
                    'user_id' => $isVol ? (int) substr($r->reader, 2) : null,
                    'name'    => $name,
                    'photo'   => $u->photo ?? null,
                    'at'      => \Carbon\Carbon::parse($r->read_at),
                ];
            })->values();

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
                    'seen_by'         => self::seenBy($m, $readers),
                ])->all();

            $read = DB::table('group_reads')->where('reader', self::reader())->value('read_at');

            return ['messages' => $messages, 'readAt' => $read ? \Carbon\Carbon::parse($read)->toJSON() : null];
        } catch (\Throwable $e) {
            return ['messages' => [], 'readAt' => null];
        }
    }

    /** Other readers who have already seen this message (not the sender, not the current reader). */
    private static function seenBy($m, $readers): array
    {
        return $readers
            ->filter(fn ($r) => $r['at']->gte($m->created_at)
                && ! ($m->sender_type === 'volunteer' && $r['user_id'] !== null && $r['user_id'] === (int) $m->user_id))
            ->map(fn ($r) => ['name' => $r['name'], 'photo' => $r['photo']])
            ->values()
            ->all();
    }

    public static function set(string $name, ?string $value): void
    {
        DB::table('chat_settings')->updateOrInsert(['name' => $name], ['value' => $value]);
    }
}