<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'biometric_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedInteger('biometric_id')->nullable();
            });
        }

        if (!Schema::hasColumn('users', 'biometric_enrolled_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('biometric_enrolled_at')->nullable();
            });
        }

        DB::table('users')->whereNull('biometric_id')->update(['biometric_id' => DB::raw('id')]);

        $hasUnique = count(DB::select("SHOW INDEX FROM users WHERE Column_name = 'biometric_id' AND Non_unique = 0")) > 0;
        if (!$hasUnique) {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('biometric_id');
            });
        }

        if (!Schema::hasTable('biometric_devices')) {
            Schema::create('biometric_devices', function (Blueprint $table) {
                $table->id();
                $table->string('serial_number')->unique();
                $table->string('name')->nullable();
                $table->timestamp('last_seen_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('biometric_scans')) {
            Schema::create('biometric_scans', function (Blueprint $table) {
                $table->id();
                $table->string('device_serial')->nullable();
                $table->string('biometric_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->dateTime('scanned_at');
                $table->string('result')->default('pending');
                $table->unsignedBigInteger('attendance_id')->nullable();
                $table->json('raw')->nullable();
                $table->timestamps();
                $table->index(['biometric_id', 'scanned_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('biometric_scans');
        Schema::dropIfExists('biometric_devices');
        if (Schema::hasColumn('users', 'biometric_enrolled_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('biometric_enrolled_at');
            });
        }
    }
};