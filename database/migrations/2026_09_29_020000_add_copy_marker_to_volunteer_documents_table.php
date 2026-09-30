<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('volunteer_documents', function (Blueprint $table) {
            $table->boolean('is_copy')->default(false)->after('is_archived');
            $table->unsignedBigInteger('copied_from_id')->nullable()->after('is_copy');
        });
    }

    public function down(): void
    {
        Schema::table('volunteer_documents', function (Blueprint $table) {
            $table->dropColumn(['is_copy', 'copied_from_id']);
        });
    }
};