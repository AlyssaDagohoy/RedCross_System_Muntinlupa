<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user()?->load('roles'),
            ],
            'adminProfile' => fn () => ($request->user() && $request->user()->hasAnyRole(['admin', 'Admin'])) ? session('admin_profile') : null,
            'staffList' => fn () => \App\Support\AdminStaff::all(),
            'profilePinned' => fn () => \Illuminate\Support\Facades\Schema::hasTable('admin_profile_pins') ? \Illuminate\Support\Facades\DB::table('admin_profile_pins')->pluck('name')->all() : [],
            'staffPhotos' => fn () => \Illuminate\Support\Facades\Schema::hasTable('admin_profile_details') ? \Illuminate\Support\Facades\DB::table('admin_profile_details')->whereNotNull('photo')->pluck('photo', 'name')->all() : [],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
            'volunteerSetup' => fn () => [
                'profile_completed' => $request->user()?->isProfileComplete() ?? false,
            ],
            'volunteerNotifications' => fn () => ($request->user() && $request->user()->hasRole('volunteer')) ? [
                'items' => \App\Models\Notification::where('user_id', $request->user()->id)
                    ->latest()
                    ->take(8)
                    ->get()
                    ->map(fn ($n) => [
                        'id'           => $n->id,
                        'category'     => $n->category,
                        'title'        => $n->title,
                        'message'      => $n->message,
                        'body'         => $n->message,
                        'action_label' => $n->action_label,
                        'action_url'   => $n->action_url,
                        'read'         => (bool) $n->read,
                        'created_at'   => $n->created_at,
                        'time'         => $n->created_at?->diffForHumans(),
                    ])
                    ->values(),
                'unread' => \App\Models\Notification::where('user_id', $request->user()->id)
                    ->where('read', false)
                    ->count(),
            ] : null,
        ];
    }
}