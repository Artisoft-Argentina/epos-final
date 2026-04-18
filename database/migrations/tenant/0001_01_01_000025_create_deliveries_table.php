<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales');
            $table->foreignId('product_id')->constrained('products');
            $table->integer('quantity');                                                    // cantidad → quantity
            $table->date('delivery_date');                                                  // fecha_entrega → delivery_date
            $table->text('notes')->nullable();                                              // observaciones → notes
            $table->enum('status', ['pending', 'delivered', 'cancelled'])->default('pending'); // valores en inglés
            $table->timestamp('actual_delivery_date')->nullable();                          // fecha_entrega_real → actual_delivery_date
            $table->softDeletes();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
