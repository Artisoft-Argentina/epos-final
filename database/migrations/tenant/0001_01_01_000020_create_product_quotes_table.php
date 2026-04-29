<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_quotes', function (Blueprint $table) {
            $table->id();
            $table->string('supplier_code')->nullable();  // codprov → supplier_code
            $table->string('sku');                         // codarticulo → sku
            $table->string('name');                        // articulo → name
            $table->string('unit');                        // medida → unit
            $table->unsignedInteger('quantity');                   // cantidad → quantity
            $table->decimal('unit_price', 12, 2);          // preciounitario → unit_price
            $table->decimal('discount', 12, 2);            // bonificacion → discount
            $table->decimal('tax_rate', 12, 2);            // alicuota → tax_rate
            $table->decimal('subtotal', 12, 2);
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('quote_id')->constrained('quotes');
            $table->softDeletes();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_quotes');
    }
};
