<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

\Illuminate\Support\Facades\Schedule::command('attendance:close')->everyFiveMinutes();
\Illuminate\Support\Facades\Schedule::call(fn () => \App\Models\Activity::syncStatuses())->everyMinute();
