<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->text('address')->nullable()->after('phone');
            $table->date('birthdate')->nullable()->after('address');
            $table->enum('gender', ['Male', 'Female', 'Other'])->nullable()->after('birthdate');
            $table->string('emergency_contact_name')->nullable()->after('gender');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
            $table->string('photo')->nullable()->after('emergency_contact_phone');
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone', 'address', 'birthdate', 'gender',
                'emergency_contact_name', 'emergency_contact_phone', 'photo'
            ]);
        });
    }
};