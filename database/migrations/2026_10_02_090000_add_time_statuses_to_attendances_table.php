<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('time_in_status')->nullable()->after('status');
            $table->string('time_out_status')->nullable()->after('time_in_status');
            $table->decimal('time_out_latitude', 10, 8)->nullable()->after('time_out_status');
            $table->decimal('time_out_longitude', 11, 8)->nullable()->after('time_out_latitude');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['time_in_status', 'time_out_status', 'time_out_latitude', 'time_out_longitude']);
        });
    }
};