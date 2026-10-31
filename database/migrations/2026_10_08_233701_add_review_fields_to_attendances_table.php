<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'status')) {
                $table->string('status')->default('present')->after('attendance_method');
            }
            if (!Schema::hasColumn('attendances', 'remarks')) {
                $table->text('remarks')->nullable();
            }
            if (!Schema::hasColumn('attendances', 'edited_by')) {
                $table->foreignId('edited_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('attendances', 'edited_at')) {
                $table->timestamp('edited_at')->nullable();
            }
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dateTime('time_in')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Intentionally empty: some of these columns existed before this migration.
    }
};
