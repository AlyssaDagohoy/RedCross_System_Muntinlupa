<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('attendances')
            ->where('attendance_method', 'manual')
            ->where('review_reason', 'like', 'DTR (%')
            ->update(['attendance_method' => 'dtr']);
    }

    public function down(): void
    {
        DB::table('attendances')
            ->where('attendance_method', 'dtr')
            ->update(['attendance_method' => 'manual']);
    }
};