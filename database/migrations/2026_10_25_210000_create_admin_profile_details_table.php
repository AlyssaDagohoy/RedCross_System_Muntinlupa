<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('admin_profile_details')) {
            Schema::create('admin_profile_details', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('title')->nullable();
                $table->string('personal_email')->nullable();
                $table->string('phone', 20)->nullable();
                $table->date('birthdate')->nullable();
                $table->string('blood_type', 10)->nullable();
                $table->text('address')->nullable();
                $table->string('emergency_contact_name')->nullable();
                $table->string('emergency_contact_phone', 20)->nullable();
                $table->string('photo')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('admin_renames')) {
            Schema::create('admin_renames', function (Blueprint $table) {
                $table->id();
                $table->string('old_name')->unique();
                $table->string('new_name');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_renames');
        Schema::dropIfExists('admin_profile_details');
    }
};