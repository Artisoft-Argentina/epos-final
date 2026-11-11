<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type'); // valores controlados por StockMovement::TYPES
            $table->unsignedInteger('quantity');                                // cantidad → quantity
            $table->date('date');                                     // fecha → date
            $table->foreignUuid('stock_id')->constrained('stocks');      // inventario_id → stock_id
            $table->unsignedBigInteger('voucher_number')->nullable();           // numcomprobante → voucher_number
            $table->nullableUuidMorphs('referenceable'); // referenciable → referenceable
            $table->string('reason')->nullable();                       // motivo → reason
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
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
