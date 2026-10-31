<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('attendances', 'edited_by')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->dropConstrainedForeignId('edited_by');
            });
        }
        foreach (['remarks', 'edited_at'] as $col) {
            if (Schema::hasColumn('attendances', $col)) {
                Schema::table('attendances', function (Blueprint $table) use ($col) {
                    $table->dropColumn($col);
                });
            }
        }
    }

    public function down(): void {}
};
