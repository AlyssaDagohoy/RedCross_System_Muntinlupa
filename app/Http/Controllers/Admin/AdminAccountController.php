<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AdminAccountController extends Controller
{
    /**
     * A logged-in super admin creates another admin account with a temporary password.
     * The new admin must change the password at first login.
     */
    public function store(Request $request)
    {
        abort_unless($request->user() && $request->user()->hasRole('super-admin'), 403);

        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        $user = new User();
        $user->forceFill([
            'name'                 => trim($data['name']),
            'email'                => $data['email'],
            'password'             => Hash::make($data['password']),
            'status'               => 'approved',
            'email_verified_at'    => now(),
            'must_change_password' => true,
                'must_complete_profile' => true,
        ])->save();

        $user->assignRole('admin');

        $emailed = $this->sendTemporaryPassword($user, $data['password']);

        return response()->json(['ok' => true, 'id' => $user->id, 'emailed' => $emailed]);
    }

    /** List every admin except the super admin. */
    public function index(Request $request)
    {
        abort_unless($request->user() && $request->user()->hasRole('super-admin'), 403);

        $admins = User::role(['admin', 'Admin'])->orderBy('name')->get()
            ->filter(fn ($u) => ! $u->hasRole('super-admin'))
            ->map(fn ($u) => [
                'id'                   => $u->id,
                'name'                 => $u->name,
                'email'                => $u->email,
                'must_change_password' => (bool) $u->must_change_password,
                'active'               => $u->status !== 'inactive',
            ])
            ->values();

        return response()->json(['admins' => $admins]);
    }


    /** Remove an admin: they can no longer log in. */
    public function destroy(Request $request, User $user)
    {
        if ($blocked = $this->guard($request, $user)) {
            return $blocked;
        }

        try {
            DB::transaction(function () use ($user) {
                $user->forceFill(['email' => 'removed-' . $user->id . '-' . $user->email])->save();
                $user->delete();
            });
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Could not remove this admin.'], 422);
        }

        $this->endSessions($user);

        return response()->json(['ok' => true]);
    }

    /** Set a new temporary password. The admin must change it at the next login. */
    public function resetPassword(Request $request, User $user)
    {
        if ($blocked = $this->guard($request, $user)) {
            return $blocked;
        }

        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        $user->forceFill([
            'password'             => Hash::make($data['password']),
            'must_change_password' => true,
        ])->save();

        $this->endSessions($user);

        $emailed = $this->sendTemporaryPassword($user, $data['password']);

        return response()->json(['ok' => true, 'emailed' => $emailed]);
    }

    private function sendTemporaryPassword(User $user, string $password): bool
    {
        try {
            Mail::raw(
                "Hello {$user->name},\n\n"
                . "A temporary password was set for your Scan2Serve administrator account.\n\n"
                . "Email: {$user->email}\n"
                . "Temporary password: {$password}\n\n"
                . "Log in with it. You will be asked to set a new password.\n",
                function ($m) use ($user) {
                    $m->to($user->email)->subject('Your Scan2Serve temporary password');
                }
            );
            return true;
        } catch (\Throwable $e) {
            report($e);
            return false;
        }
    }
    /** Deactivate an admin: they cannot log in, but their history stays. */
    public function deactivate(Request $request, User $user)
    {
        if ($blocked = $this->guard($request, $user)) {
            return $blocked;
        }

        $user->forceFill(['status' => 'inactive'])->save();
        $this->endSessions($user);

        return response()->json(['ok' => true]);
    }

    /** Reactivate an admin so they can log in again. */
    public function reactivate(Request $request, User $user)
    {
        if ($blocked = $this->guard($request, $user)) {
            return $blocked;
        }

        $user->forceFill(['status' => 'approved'])->save();

        return response()->json(['ok' => true]);
    }
    /** Edit an admin's full name or email. */
    public function update(Request $request, User $user)
    {
        if ($blocked = $this->guard($request, $user)) {
            return $blocked;
        }

        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);

        $data = $request->validate([
            'name'  => ['required', 'string', 'max:100'],
            'email' => ['required', 'email:rfc', 'max:255', \Illuminate\Validation\Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->forceFill([
            'name'  => trim($data['name']),
            'email' => $data['email'],
        ])->save();

        return response()->json(['ok' => true]);
    }
    private function guard(Request $request, User $user)
    {
        abort_unless($request->user() && $request->user()->hasRole('super-admin'), 403);

        if ($user->id === $request->user()->id || $user->hasRole('super-admin')) {
            return response()->json(['message' => 'The super admin account cannot be changed here.'], 422);
        }
        if (! $user->hasAnyRole(['admin', 'Admin'])) {
            return response()->json(['message' => 'That account is not an admin.'], 422);
        }

        return null;
    }

    private function endSessions(User $user): void
    {
        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }
    }
}
