<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telegram_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('telegram_user_id')->constrained()->onDelete('cascade');
            $table->bigInteger('message_id')->nullable();
            $table->text('user_message');
            $table->text('bot_response')->nullable();
            $table->json('context')->nullable();
            $table->string('function_called')->nullable();
            $table->json('function_result')->nullable();
            $table->integer('tokens_used')->nullable();
            $table->integer('response_time_ms')->nullable();
            $table->timestamps();

            $table->index('telegram_user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_conversations');
    }
};
