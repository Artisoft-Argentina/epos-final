<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_products', function (Blueprint $table) {
            $table->id();
            $table->string('supplier_code')->nullable();  // codprov → supplier_code
            $table->string('sku');                         // codarticulo → sku
            $table->string('name');                        // articulo → name
            $table->string('unit');                        // medida → unit
            $table->integer('quantity');                   // cantidad → quantity
            $table->decimal('discount', 15, 2);           // bonificacion → discount
            $table->decimal('tax_rate', 8, 2);            // alicuota → tax_rate
            $table->decimal('unit_price', 15, 2);         // preciounitario → unit_price
            $table->decimal('subtotal', 15, 2);
            $table->integer('batch')->nullable();          // lote → batch
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('order_id')->constrained('orders');
            $table->softDeletes();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_products');
    }
};
