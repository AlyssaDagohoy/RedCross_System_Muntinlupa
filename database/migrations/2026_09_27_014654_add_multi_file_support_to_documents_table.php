<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('document_request_id')->nullable()->after('user_id')
                ->constrained('document_requests')->nullOnDelete();
        });

        Schema::table('document_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('document_id');
            $table->dropColumn(['batch_id', 'batch_label']);
        });
    }

    public function down(): void
    {
        Schema::table('document_requests', function (Blueprint $table) {
            $table->uuid('batch_id')->nullable()->after('id');
            $table->string('batch_label')->nullable()->after('batch_id');
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('document_request_id');
        });
    }
};