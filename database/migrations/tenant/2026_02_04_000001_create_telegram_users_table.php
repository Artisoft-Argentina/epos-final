<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telegram_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->bigInteger('telegram_id')->unique();
            $table->string('telegram_username')->nullable();
            $table->string('telegram_first_name')->nullable();
            $table->string('telegram_last_name')->nullable();
            $table->enum('bot_type', ['admin', 'vendedor']);
            $table->string('verification_code', 6)->nullable();
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_interaction_at')->nullable();
            $table->timestamps();

            $table->index('telegram_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_users');
    }
};
