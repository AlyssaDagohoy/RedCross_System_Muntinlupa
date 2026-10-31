<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ProfilePinController extends Controller
{
    private const MAX_TRIES = 5;
    private const LOCK_MINUTES = 5;

    private function staffName(Request $request): string
    {
        $name = (string) $request->input('name');
        $match = $this->allStaff()->first(fn ($s) => strcasecmp($s, $name) === 0);
        abort_unless($match, 422);

        return $match;
    }

    public function verify(Request $request)
    {
        $name = $this->staffName($request);
        $request->validate(['pin' => 'required|digits:4']);

        $row = DB::table('admin_profile_pins')->where('name', $name)->first();
        if (! $row) {
            return response()->json(['message' => 'No PIN yet.'], 422);
        }

        if ($row->locked_until && now()->lt(\Illuminate\Support\Carbon::parse($row->locked_until))) {
            return response()->json(['message' => 'Too many tries. Try again in a few minutes.'], 429);
        }

        if (Hash::check((string) $request->input('pin'), $row->pin_hash)) {
            DB::table('admin_profile_pins')->where('name', $name)->update(['failed_attempts' => 0, 'locked_until' => null]);
            session(['admin_profile' => $name]);

            return response()->json(['ok' => true]);
        }

        $fails = ((int) $row->failed_attempts) + 1;
        if ($fails >= self::MAX_TRIES) {
            DB::table('admin_profile_pins')->where('name', $name)->update([
                'failed_attempts' => 0,
                'locked_until'    => now()->addMinutes(self::LOCK_MINUTES),
            ]);

            return response()->json(['message' => 'Too many tries. Try again in ' . self::LOCK_MINUTES . ' minutes.'], 429);
        }

        DB::table('admin_profile_pins')->where('name', $name)->update(['failed_attempts' => $fails]);
        $left = self::MAX_TRIES - $fails;

        return response()->json(['message' => 'Wrong PIN. ' . $left . ($left === 1 ? ' try' : ' tries') . ' left.'], 422);
    }

    public function create(Request $request)
    {
        $name = $this->staffName($request);
        $request->validate(['pin' => 'required|digits:4']);

        if (DB::table('admin_profile_pins')->where('name', $name)->exists()) {
            return response()->json(['message' => 'This profile already has a PIN.'], 422);
        }

        DB::table('admin_profile_pins')->insert([
            'name'            => $name,
            'pin_hash'        => Hash::make((string) $request->input('pin')),
            'failed_attempts' => 0,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
        session(['admin_profile' => $name]);

        return response()->json(['ok' => true]);
    }

    private function allStaff()
    {
        $extra = \Illuminate\Support\Facades\Schema::hasTable('admin_staff')
            ? DB::table('admin_staff')->orderBy('id')->pluck('name')->all()
            : [];

        return collect(\App\Support\AdminStaff::all());
    }

    public function addAdmin(Request $request)
    {
        abort_unless(
            $request->user() && $request->user()->hasAnyRole(['admin', 'Admin']) && session('admin_profile'),
            403
        );
        $request->validate(['name' => 'required|string|max:100', 'pin' => 'required|digits:4']);

        $name  = preg_replace('/\s+/u', ' ', trim((string) $request->input('name')));
        $words = explode(' ', $name);
        $valid = count($words) >= 2
            && collect($words)->every(fn ($w) => preg_match('/^\p{L}[\p{L}.\'\-]*$/u', $w))
            && mb_strlen($words[0]) >= 2
            && mb_strlen(end($words)) >= 2;

        if (! $valid) {
            return response()->json(['message' => 'Enter first and last name, like Maria Santos.'], 422);
        }
        if ($name === mb_strtolower($name)) {
            $name = mb_convert_case($name, MB_CASE_TITLE, 'UTF-8');
        }
        if ($this->allStaff()->contains(fn ($s) => strcasecmp($s, $name) === 0)) {
            return response()->json(['message' => 'That admin already exists.'], 422);
        }

        DB::transaction(function () use ($name, $request) {
            DB::table('admin_staff')->insert(['name' => $name, 'created_at' => now(), 'updated_at' => now()]);
            DB::table('admin_profile_pins')->insert([
                'name'            => $name,
                'pin_hash'        => Hash::make((string) $request->input('pin')),
                'failed_attempts' => 0,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        });

        return response()->json(['ok' => true]);
    }

    public function changePin(Request $request)
    {
        $name = (string) session('admin_profile');
        abort_unless($name !== '' && $request->user() && $request->user()->hasAnyRole(['admin', 'Admin']), 403);
        $request->validate(['current_pin' => 'required|digits:4', 'pin' => 'required|digits:4']);

        $row = DB::table('admin_profile_pins')->where('name', $name)->first();
        if (! $row) {
            return response()->json(['message' => 'No PIN yet.'], 422);
        }

        if ($row->locked_until && now()->lt(\Illuminate\Support\Carbon::parse($row->locked_until))) {
            return response()->json(['message' => 'Too many tries. Try again in a few minutes.'], 429);
        }

        if (! Hash::check((string) $request->input('current_pin'), $row->pin_hash)) {
            $fails = ((int) $row->failed_attempts) + 1;
            if ($fails >= self::MAX_TRIES) {
                DB::table('admin_profile_pins')->where('name', $name)->update([
                    'failed_attempts' => 0,
                    'locked_until'    => now()->addMinutes(self::LOCK_MINUTES),
                ]);

                return response()->json(['message' => 'Too many tries. Try again in ' . self::LOCK_MINUTES . ' minutes.'], 429);
            }
            DB::table('admin_profile_pins')->where('name', $name)->update(['failed_attempts' => $fails]);

            return response()->json(['message' => 'Current PIN is wrong.'], 422);
        }

        DB::table('admin_profile_pins')->where('name', $name)->update([
            'pin_hash'        => Hash::make((string) $request->input('pin')),
            'failed_attempts' => 0,
            'locked_until'    => null,
            'updated_at'      => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    public function reset(Request $request)
    {
        $name = $this->staffName($request);
        $request->validate(['password' => 'required|string']);

        if (! Hash::check((string) $request->input('password'), (string) $request->user()->password)) {
            return response()->json(['message' => 'Wrong password.'], 422);
        }

        DB::table('admin_profile_pins')->where('name', $name)->delete();
        if (session('admin_profile') === $name) {
            session()->forget('admin_profile');
        }

        return response()->json(['ok' => true]);
    }
}