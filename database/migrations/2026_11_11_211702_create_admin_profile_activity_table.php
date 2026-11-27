<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('admin_profile_activity')) {
            return;
        }

        Schema::create('admin_profile_activity', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamp('last_active_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_profile_activity');
    }
};