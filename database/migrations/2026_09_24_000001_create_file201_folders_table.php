<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Volunteer's own folders
        Schema::create('file201_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->timestamps();

            $table->unique(['user_id', 'name']);
        });

        // 2. File requests (what the volunteer asks for, and the admin's decision)
        Schema::create('file_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('requested_document');            // what the volunteer typed
            $table->string('type');                          // what the system identified it as
            $table->text('purpose')->nullable();
            $table->string('status')->default('pending');    // pending | approved | rejected
            $table->text('admin_remarks')->nullable();
            $table->timestamps();
        });

        // 3. Approved files given to the volunteer.
        //    folder_id = null means "not yet filed" (shows under Approved).
        Schema::create('volunteer_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('file_request_id')->nullable()->constrained('file_requests')->nullOnDelete();
            $table->foreignId('folder_id')->nullable()->constrained('file201_folders')->nullOnDelete();
            $table->string('name');
            $table->string('type')->nullable();
            $table->string('path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('volunteer_documents');
        Schema::dropIfExists('file_requests');
        Schema::dropIfExists('file201_folders');
    }
};
