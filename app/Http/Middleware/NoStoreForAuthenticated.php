<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NoStoreForAuthenticated
{
    /**
     * Stop the browser from keeping copies of pages shown to a logged-in user,
     * so the Back button cannot show them again after logout.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->user()
            && ! $response instanceof BinaryFileResponse
            && ! $response instanceof StreamedResponse) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
        }

        return $response;
    }
}