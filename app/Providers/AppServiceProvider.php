<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Remember when a volunteer was approved (used by the group chat history).
        \App\Models\User::saving(function ($user) {
            static $has = null;
            if ($has === null) {
                try { $has = \Illuminate\Support\Facades\Schema::hasColumn('users', 'approved_at'); } catch (\Throwable $e) { $has = false; }
            }
            if (! $has || ! $user->isDirty('status')) {
                return;
            }
            if ($user->status === 'approved') {
                $user->approved_at = now();
            } elseif ($user->getOriginal('status') === 'approved') {
                $user->approved_at = null;
            }
        });

        // Force localhost instead of 127.0.0.1
        if (request()->getHost() === '127.0.0.1') {
            URL::forceRootUrl('http://localhost:8000');
            redirect('http://localhost:8000' . request()->getRequestUri())->send();
        }
    }
}