<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('file201_folders', function (Blueprint $table) {
            $table->index('user_id');
            $table->dropUnique(['user_id', 'name']);
            $table->foreignId('parent_id')->nullable()->after('user_id')
                ->constrained('file201_folders')->cascadeOnDelete();
            $table->unique(['user_id', 'parent_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('file201_folders', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'parent_id', 'name']);
            $table->dropConstrainedForeignId('parent_id');
            $table->unique(['user_id', 'name']);
            $table->dropIndex(['user_id']);
        });
    }
};
