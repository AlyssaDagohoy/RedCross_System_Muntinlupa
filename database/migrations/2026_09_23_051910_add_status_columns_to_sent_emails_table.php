<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sent_emails', function (Blueprint $table) {
            // Separate status per box, since one row can appear as BOTH a Sent
            // item and an Inbox item (once it has a reply) — deleting it from
            // one box must not affect the other.
            $table->enum('sent_status', ['active', 'archived', 'trashed', 'purged'])
                ->default('active')->after('reply');
            $table->enum('inbox_status', ['active', 'archived', 'trashed', 'purged'])
                ->default('active')->after('sent_status');

            $table->timestamp('read_at')->nullable()->after('inbox_status');
            $table->timestamp('starred_at')->nullable()->after('read_at');
        });
    }

    public function down(): void
    {
        Schema::table('sent_emails', function (Blueprint $table) {
            $table->dropColumn(['sent_status', 'inbox_status', 'read_at', 'starred_at']);
        });
    }
};