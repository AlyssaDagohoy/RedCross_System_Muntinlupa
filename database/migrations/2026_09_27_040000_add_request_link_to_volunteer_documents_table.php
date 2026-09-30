<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('volunteer_documents', function (Blueprint $table) {
            $table->foreignId('document_request_id')->nullable()->after('user_id')
                ->constrained('document_requests')->nullOnDelete();
            $table->string('original_name')->nullable()->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('volunteer_documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('document_request_id');
            $table->dropColumn('original_name');
        });
    }
};
