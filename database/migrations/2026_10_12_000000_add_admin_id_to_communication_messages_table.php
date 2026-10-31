<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('communication_messages', function (Blueprint $table) {
            // Which admin wrote this message (null for volunteer messages and old replies)
            $table->unsignedBigInteger('admin_id')->nullable()->after('sender_type')->index();
        });
    }

    public function down(): void
    {
        Schema::table('communication_messages', function (Blueprint $table) {
            $table->dropColumn('admin_id');
        });
    }
};