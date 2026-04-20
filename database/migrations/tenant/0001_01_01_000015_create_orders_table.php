<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // orders = órdenes de pedido a proveedores (antes remitos)
        // supplier_receipt_number: nro de remito del proveedor, se carga al recibir la mercadería
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->integer('pos_number');                                  // ptoventa → pos_number
            $table->integer('order_number');                                // numremito → order_number
            $table->date('date');                                         // fecha → date
            $table->decimal('surcharge', 12, 2);                           // recargo → surcharge
            $table->decimal('discount', 12, 2);                            // bonificacion → discount
            $table->decimal('subtotal', 12, 2);
            $table->decimal('total', 12, 2);
            $table->string('supplier_receipt_number')->nullable();          // ✚ nuevo
            $table->boolean('converted_to_inventory')->default(false);     // convertido_inventario → converted_to_inventory
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->foreignId('user_id')->constrained('users');
            $table->softDeletes();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
