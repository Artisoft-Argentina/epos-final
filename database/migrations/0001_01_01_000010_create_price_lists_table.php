<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_lists', function (Blueprint $table) {
            $table->id();
            $table->string('name');                              // nombre → name
            $table->decimal('percentage', 8, 2)->default(0);    // porcentaje → percentage
            $table->enum('pricing_strategy', ['list', 'product'])->default('list');
            $table->boolean('default_pos')->default(false);
            $table->boolean('default_ecommerce')->default(false);
            $table->softDeletes();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_lists');
    }
};
