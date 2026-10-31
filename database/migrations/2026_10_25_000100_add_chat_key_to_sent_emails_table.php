<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sent_emails', function (Blueprint $table) {
            // null = Red Cross team group chat, otherwise the staff name of a private chat
            $table->string('chat_key', 60)->nullable()->after('user_id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('sent_emails', function (Blueprint $table) {
            $table->dropIndex(['chat_key']);
            $table->dropColumn('chat_key');
        });
    }
};