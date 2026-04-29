<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('supplier_code')->nullable();  // codprov → supplier_code
            $table->string('sku');                         // codarticulo → sku
            $table->string('name');                        // articulo → name
            $table->text('description');                   // descripcion → description
            $table->string('unit');                        // medida → unit
            $table->decimal('price', 12, 2);                // precio → price
            $table->decimal('tax_rate', 8, 2);             // alicuota → tax_rate
            $table->integer('min_stock');                  // stockminimo → min_stock
            $table->foreignId('brand_id')->constrained('brands');
            $table->foreignId('category_id')->constrained('categories');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('barcode')->nullable()->unique();  // codigo_barras → barcode
            $table->string('qr_code')->nullable()->unique();  // codigo_qr → qr_code
            $table->boolean('active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
