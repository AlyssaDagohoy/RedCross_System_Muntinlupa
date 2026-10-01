<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->text('review_reason')->nullable()->after('status');
            $table->timestamp('review_requested_at')->nullable()->after('review_reason');
            $table->text('admin_remark')->nullable()->after('review_requested_at');
            $table->foreignId('reviewed_by')->nullable()->after('admin_remark')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn(['review_reason', 'review_requested_at', 'admin_remark', 'reviewed_at']);
        });
    }
};