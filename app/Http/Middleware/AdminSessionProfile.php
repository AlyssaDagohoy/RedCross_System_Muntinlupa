<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminSessionProfile
{
    /**
     * Each admin now logs in with their own account, so the "profile" used by
     * the chat, activity and profile page is simply the logged-in admin's name.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->hasAnyRole(['admin', 'Admin']) && ! session('admin_profile')) {
            session(['admin_profile' => (string) $user->name]);
        }

        return $next($request);
    }
}
