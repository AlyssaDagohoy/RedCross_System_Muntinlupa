<?php

namespace App\Http\Middleware;

use App\Providers\RouteServiceProvider;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $user = Auth::guard($guard)->user();

                // Redirect based on role
                if ($user->hasRole('admin')) {
                    // Admin is stuck on the "Who's using this?" picker (no profile chosen yet):
                    // going back to /login ends the session and shows the login form.
                    if (! session('admin_profile')) {
                        Auth::guard($guard)->logout();
                        $request->session()->invalidate();
                        $request->session()->regenerateToken();

                        return redirect()->route('login');
                    }

                    return redirect()->route('admin.dashboard');
                }

                if ($user->hasRole('volunteer') && $user->status === 'approved') {
                    return redirect()->route('volunteer.dashboard');
                }

                // If volunteer is pending, log them out
                Auth::guard($guard)->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors([
                    'email' => 'Your account is pending approval. Please wait for admin approval.',
                ]);
            }
        }

        return $next($request);
    }
}
