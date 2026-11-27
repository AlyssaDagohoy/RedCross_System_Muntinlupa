<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(Request $request): Response
    {
        $admins = $request->boolean('chooser') ? $this->rememberedAdmins($request) : collect();

        if ($admins->isNotEmpty()) {
            return Inertia::render('Auth/ChooseProfile', [
                'admins' => $admins,
                'canResetPassword' => Route::has('password.request'),
                'status' => session('status'),
            ]);
        }

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Admins who have signed in on this browser (encrypted cookie), most recent first.
     */
    private function rememberedAdmins(Request $request)
    {
        $ids = json_decode((string) $request->cookie('known_admins'), true);

        if (! is_array($ids) || $ids === []) {
            return collect();
        }

        $users = User::query()->whereIn('id', $ids)->get()->keyBy('id');

        return collect($ids)
            ->map(fn ($id) => $users->get($id))
            ->filter(fn ($u) => $u && $u->hasRole('admin'))
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'avatar' => null,
                'last_seen_at' => $u->last_seen_at
                    ? \Illuminate\Support\Carbon::parse($u->last_seen_at)->toIso8601String()
                    : null,
            ])
            ->values();
    }

    /**
     * Remember this admin on this browser so the profile picker can show them next time.
     */
    private function rememberAdmin(Request $request, $user): void
    {
        $ids = json_decode((string) $request->cookie('known_admins'), true);
        $ids = is_array($ids) ? $ids : [];
        $ids = array_slice(array_values(array_unique(array_merge([$user->id], $ids))), 0, 6);

        Cookie::queue('known_admins', json_encode($ids), 60 * 24 * 365);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = $request->user();

        // A deactivated account cannot log in
        if ($user->status === 'inactive') {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'This account has been deactivated. Please contact the superadmin.',
            ]);
        }
        // Check if volunteer is approved
        if ($user->hasRole('volunteer') && $user->status !== 'approved') {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Your account is pending approval. Please wait for the admin to approve your account.',
            ]);
        }

        if ($user->hasRole('admin')) {
            $this->rememberAdmin($request, $user);

            return redirect()->route('admin.dashboard');
        }

        if ($user->hasRole('volunteer')) {
            return redirect()->route('volunteer.dashboard');
        }

        // No role assigned
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->withErrors([
            'email' => 'Your account has no role assigned. Please contact the administrator.',
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $wasAdmin = $request->user() && $request->user()->hasAnyRole(['admin', 'Admin']);
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}