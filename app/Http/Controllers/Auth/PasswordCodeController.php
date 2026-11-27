<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\EmailCodeService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class PasswordCodeController extends Controller
{
    /** Emails a 6-digit reset code. The answer is the same whether or not the account exists. */
    public function send(Request $request, EmailCodeService $codes): RedirectResponse
    {
        $request->validate(['email' => 'required|email']);
        $email = strtolower(trim($request->email));

        $limiterKey = 'pwcode-send:' . sha1($email . '|' . $request->ip());
        if (RateLimiter::tooManyAttempts($limiterKey, 3)) {
            $mins = max(1, (int) ceil(RateLimiter::availableIn($limiterKey) / 60));
            throw ValidationException::withMessages([
                'email' => "Too many requests. Please try again in {$mins} minute(s).",
            ]);
        }
        RateLimiter::hit($limiterKey, 900);

        $user = User::where('email', $email)->first();

        if ($user) {
            $code = $codes->issue('password-reset', $email, 10);

            try {
                Mail::raw(
                    "Your Scan2Serve password reset code is {$code}\n\nIt expires in 10 minutes. If you did not ask for this, you can ignore this email.",
                    function ($m) use ($email) {
                        $m->to($email)->subject('Your Scan2Serve password reset code');
                    }
                );
            } catch (\Throwable $e) {
                Log::error('Password reset code email failed: ' . $e->getMessage());
                throw ValidationException::withMessages([
                    'email' => 'We could not send the email right now. Please try again.',
                ]);
            }
        }

        return back()->with('status', 'code-sent');
    }

    /** Checks the code and sets the new password. */
    public function reset(Request $request, EmailCodeService $codes): RedirectResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'code'     => 'required|digits:6',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $email = strtolower(trim($request->email));

        $limiterKey = 'pwcode-reset:' . sha1($email . '|' . $request->ip());
        if (RateLimiter::tooManyAttempts($limiterKey, 10)) {
            throw ValidationException::withMessages([
                'code' => 'Too many attempts. Please request a new code later.',
            ]);
        }
        RateLimiter::hit($limiterKey, 900);

        $user = User::where('email', $email)->first();

        if (!$user || !$codes->verify('password-reset', $email, $request->code)) {
            throw ValidationException::withMessages([
                'code' => 'The code is invalid or has expired.',
            ]);
        }

        $user->forceFill([
            'password'       => Hash::make($request->password),
            'remember_token' => Str::random(60),
            'must_change_password' => false,
        ])->save();

        event(new PasswordReset($user));

        return redirect()->route('login')->with('status', 'Your password has been reset. You can log in now.');
    }
}