<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminStaff
{
    public static function renames(): array
    {
        return Schema::hasTable('admin_renames')
            ? DB::table('admin_renames')->pluck('new_name', 'old_name')->all()
            : [];
    }

    public static function all(): array
    {
        $renames = self::renames();
        $base = array_map(fn ($n) => $renames[$n] ?? $n, config('staff.admins', []));
        $extra = Schema::hasTable('admin_staff')
            ? DB::table('admin_staff')->orderBy('id')->pluck('name')->all()
            : [];

        return array_values(array_unique(array_merge($base, $extra)));
    }

    public static function tidy(string $name): string
    {
        $n = preg_replace('/\s+/u', ' ', trim($name));

        return $n === mb_strtolower($n) ? mb_convert_case($n, MB_CASE_TITLE, 'UTF-8') : $n;
    }

    public static function isFullName(string $name): bool
    {
        $words = array_values(array_filter(explode(' ', preg_replace('/\s+/u', ' ', trim($name)))));
        if (count($words) < 2) {
            return false;
        }
        foreach ($words as $w) {
            if (! preg_match('/^\p{L}[\p{L}.\'\-]*$/u', $w)) {
                return false;
            }
        }

        return mb_strlen($words[0]) >= 2 && mb_strlen(end($words)) >= 2;
    }

    public static function rename(string $old, string $new): void
    {
        $inStaff = Schema::hasTable('admin_staff') && DB::table('admin_staff')->where('name', $old)->exists();

        if ($inStaff) {
            DB::table('admin_staff')->where('name', $old)->update(['name' => $new, 'updated_at' => now()]);
        } else {
            $row = DB::table('admin_renames')->where('new_name', $old)->first();
            if ($row) {
                DB::table('admin_renames')->where('id', $row->id)->update(['new_name' => $new, 'updated_at' => now()]);
            } else {
                DB::table('admin_renames')->insert([
                    'old_name'   => $old,
                    'new_name'   => $new,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        DB::table('admin_profile_pins')->where('name', $old)->update(['name' => $new, 'updated_at' => now()]);
        DB::table('admin_profile_details')->where('name', $old)->update(['name' => $new]);
        DB::table('activities')->where('assigned_by', $old)->update(['assigned_by' => $new]);
    }
}