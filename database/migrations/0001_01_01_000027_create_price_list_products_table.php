<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_list_products', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('gen_random_uuid()'))->primary();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('price_list_id')->constrained('price_lists')->cascadeOnDelete();
            $table->decimal('price', 12, 2);
            $table->boolean('is_manual')->default(false);
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
