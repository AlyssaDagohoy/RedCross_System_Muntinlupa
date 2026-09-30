<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('volunteer_documents', function (Blueprint $table) {
            $table->boolean('is_starred')->default(false);
        });
        Schema::table('file201_folders', function (Blueprint $table) {
            $table->boolean('is_starred')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('volunteer_documents', function (Blueprint $table) {
            $table->dropColumn('is_starred');
        });
        Schema::table('file201_folders', function (Blueprint $table) {
            $table->dropColumn('is_starred');
        });
    }
};