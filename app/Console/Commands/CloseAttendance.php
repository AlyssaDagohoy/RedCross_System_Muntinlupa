<?php

namespace App\Console\Commands;

use App\Models\Attendance;
use Illuminate\Console\Command;

class CloseAttendance extends Command
{
    protected $signature = 'attendance:close';

    protected $description = 'Mark missing Time Outs as Needs Review and missing Time Ins as Absent';

    public function handle(): int
    {
        Attendance::markAbsences();
        $this->info('Attendance records updated.');

        return self::SUCCESS;
    }
}