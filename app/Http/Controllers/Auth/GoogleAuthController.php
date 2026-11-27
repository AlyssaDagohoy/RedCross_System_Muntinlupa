<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        $request->session()->put('google_from', $request->query('from') === 'register' ? 'register' : 'login');
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $from = $request->session()->pull('google_from', 'login');

        if ($request->filled('error')) {
            return $this->fail('Google sign-in was cancelled.');
        }

        try {
            $google = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            report($e);

            return $this->fail('Google sign-in did not work. Please try again.');
        }

        $email    = strtolower((string) $google->getEmail());
        $verified = filter_var(data_get($google->user, 'email_verified', false), FILTER_VALIDATE_BOOLEAN);

        if ($email === '' || ! $verified) {
            return $this->fail('Your Google email could not be verified.');
        }

        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $user) {
            if ($from === 'register') {
                return redirect()->route('register', ['name' => (string) $google->getName(), 'email' => $email]);
            }

            return $this->fail('No account uses ' . $email . '. Please use Register as Volunteer first.', $email);
        }

        if ($user->status === 'inactive') {
            return $this->fail('This account has been deactivated. Please contact the superadmin.');
        }

        if ($user->hasRole('admin')) {
            return $this->fail('Admins sign in with their email and password.');
        }

        if (! $user->hasRole('volunteer')) {
            return $this->fail('Your account has no role assigned. Please contact the administrator.');
        }

        if ($user->status !== 'approved') {
            return $this->fail('Your account is pending approval. Please wait for the admin to approve your account.');
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('volunteer.dashboard');
    }

    private function fail(string $message, ?string $email = null): RedirectResponse
    {
        return redirect()->route('login')->withErrors(['email' => $message])->withInput(['email' => $email]);
    }
}