<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'fallback_photo_path')) {
                $table->string('fallback_photo_path')->nullable()->after('attendance_method');
            }
            if (!Schema::hasColumn('attendances', 'fallback_distance')) {
                $table->decimal('fallback_distance', 5, 3)->nullable()->after('fallback_photo_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['fallback_photo_path', 'fallback_distance']);
        });
    }
};