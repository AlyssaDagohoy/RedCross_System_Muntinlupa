<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communication_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sent_email_id')->constrained('sent_emails')->cascadeOnDelete();
            $table->enum('sender_type', ['volunteer', 'admin']);
            $table->text('body');
            $table->timestamps();
        });

        DB::table('sent_emails')->orderBy('id')->chunkById(100, function ($threads) {
            foreach ($threads as $thread) {
                DB::table('communication_messages')->insert([
                    'sent_email_id' => $thread->id,
                    'sender_type' => 'volunteer',
                    'body' => $thread->message,
                    'created_at' => $thread->created_at,
                    'updated_at' => $thread->created_at,
                ]);

                if (!empty($thread->reply)) {
                    DB::table('communication_messages')->insert([
                        'sent_email_id' => $thread->id,
                        'sender_type' => 'admin',
                        'body' => $thread->reply,
                        'created_at' => $thread->replied_at ?? $thread->created_at,
                        'updated_at' => $thread->replied_at ?? $thread->created_at,
                    ]);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_messages');
    }
};