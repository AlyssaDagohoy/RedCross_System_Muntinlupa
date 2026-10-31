<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('admin_profile_pins')) {
            Schema::create('admin_profile_pins', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('pin_hash');
                $table->unsignedTinyInteger('failed_attempts')->default(0);
                $table->timestamp('locked_until')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_profile_pins');
    }
};