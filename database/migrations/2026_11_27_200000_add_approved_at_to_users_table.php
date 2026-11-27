<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'approved_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('approved_at')->nullable();
            });
        }

        DB::table('users')->where('status', 'approved')->whereNull('approved_at')->update(['approved_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'approved_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('approved_at');
            });
        }
    }
};