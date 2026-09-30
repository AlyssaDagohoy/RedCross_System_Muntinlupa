<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL/MariaDB can't just add an enum value with a simple column change on
        // some versions, so we widen status to a plain string instead of another enum.
        // Existing values (pending, approved, rejected) still work unchanged.
        Schema::table('documents', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->text('admin_remarks')->nullable()->after('status');
            $table->foreignId('reviewed_by')->nullable()->after('admin_remarks')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn(['admin_remarks', 'reviewed_at']);
        });
    }
};
