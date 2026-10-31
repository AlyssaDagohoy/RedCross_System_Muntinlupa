<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('group_messages')) {
            Schema::create('group_messages', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->enum('sender_type', ['volunteer', 'admin']);
                $table->string('label', 80)->nullable();
                $table->text('body')->nullable();
                $table->string('attachment_path')->nullable();
                $table->string('attachment_name', 120)->nullable();
                $table->string('attachment_mime', 100)->nullable();
                $table->timestamps();
                $table->index('created_at');
            });
        }

        if (! Schema::hasTable('group_reads')) {
            Schema::create('group_reads', function (Blueprint $table) {
                $table->id();
                $table->string('reader', 120)->unique();
                $table->timestamp('read_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('group_reads');
        Schema::dropIfExists('group_messages');
    }
};