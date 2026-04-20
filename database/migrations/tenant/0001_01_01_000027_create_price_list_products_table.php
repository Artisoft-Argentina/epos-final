<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_list_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('price_list_id')->constrained('price_lists')->cascadeOnDelete();
            $table->decimal('price', 12, 2);
            $table->softDeletes();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['product_id', 'price_list_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_list_products');
    }
};
