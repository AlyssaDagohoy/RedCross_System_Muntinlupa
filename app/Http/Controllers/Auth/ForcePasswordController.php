<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ForcePasswordController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        if (! $user->must_change_password) {
            return redirect($this->home($user));
        }

        return Inertia::render('Auth/ForcePasswordChange');
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'password' => ['required', 'string', 'min:8', 'max:100', 'confirmed'],
        ]);

        if (Hash::check((string) $request->input('password'), (string) $user->password)) {
            throw ValidationException::withMessages([
                'password' => 'Choose a password different from the temporary one.',
            ]);
        }

        $user->forceFill([
            'password'             => Hash::make((string) $request->input('password')),
            'must_change_password' => false,
        ])->save();

        return redirect($this->home($user));
    }

    private function home($user): string
    {
        return $user->hasAnyRole(['admin', 'Admin'])
            ? route('admin.dashboard')
            : route('volunteer.dashboard');
    }
}
