<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdminProfile
{
    /**
     * A newly created admin must complete their profile first.
     * Until then every page opens the profile page (logout and password screens still work).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->must_complete_profile || $user->must_change_password) {
            return $next($request);
        }

        if (! $request->isMethod('GET') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
            return $next($request);
        }

        if ($request->routeIs('admin.profile', 'admin.profile.*', 'logout', 'password.force.*')) {
            return $next($request);
        }

        return redirect()->route('admin.profile');
    }
}
