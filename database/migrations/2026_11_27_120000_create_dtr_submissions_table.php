<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dtr_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('activity_id')->nullable()->constrained()->nullOnDelete();
            $table->string('filing_type');            // before | after
            $table->string('reason_type');            // no_signal | sick | emergency | other
            $table->date('date');
            $table->string('time_in', 5)->nullable();  // H:i
            $table->string('time_out', 5)->nullable(); // H:i
            $table->string('location')->nullable();
            $table->text('details');
            $table->string('witness')->nullable();
            $table->string('proof_path');
            $table->string('proof_name')->nullable();
            $table->string('status')->default('pending'); // pending | approved | rejected
            $table->string('decision')->nullable();       // excused | present
            $table->text('admin_remark')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dtr_submissions');
    }
};