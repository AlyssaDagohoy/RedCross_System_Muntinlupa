<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sent_emails', function (Blueprint $table) {
            // The admin's own mailbox state, separate from the volunteer's.
            $table->string('admin_inbox_status')->default('active');
            $table->string('admin_sent_status')->default('active');
            $table->timestamp('admin_read_at')->nullable();
            $table->timestamp('admin_starred_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('sent_emails', function (Blueprint $table) {
            $table->dropColumn(['admin_inbox_status', 'admin_sent_status', 'admin_read_at', 'admin_starred_at']);
        });
    }
};