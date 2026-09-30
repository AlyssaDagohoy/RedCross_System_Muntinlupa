<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // volunteer
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade'); // admin
            $table->string('document_name');
            $table->text('instructions')->nullable();
            $table->date('due_date')->nullable();
            $table->string('status')->default('pending_submission'); // pending_submission, submitted
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete(); // linked upload once submitted
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_requests');
    }
};