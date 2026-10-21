<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // valores controlados por StockMovement::TYPES
            $table->unsignedInteger('quantity');                                // cantidad → quantity
            $table->date('date');                                     // fecha → date
            $table->foreignId('stock_id')->constrained('stocks');      // inventario_id → stock_id
            $table->unsignedBigInteger('voucher_number')->nullable();           // numcomprobante → voucher_number
            $table->string('referenceable_type')->nullable();           // referenciable_type → referenceable_type
            $table->unsignedBigInteger('referenceable_id')->nullable(); // referenciable_id → referenceable_id
            $table->string('reason')->nullable();                       // motivo → reason
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
