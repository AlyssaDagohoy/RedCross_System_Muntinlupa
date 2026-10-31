<?php

namespace App\Console\Commands;

use App\Services\BiometricAttendanceService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SimulateBiometricScan extends Command
{
    protected $signature = 'biometric:simulate {biometric_id} {--at= : Scan time, for example "2026-10-09 13:05"}';

    protected $description = 'Pretend a fingerprint scan happened (for testing without the device)';

    public function handle(BiometricAttendanceService $service): int
    {
        $at = $this->option('at') ? Carbon::parse($this->option('at')) : Carbon::now();

        $scan = $service->handleScan((string) $this->argument('biometric_id'), $at, 'SIMULATOR', ['simulated' => true]);

        $this->info('Scan at ' . $at->format('Y-m-d H:i:s') . ' -> ' . $scan->result);

        return self::SUCCESS;
    }
}