<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('transfer_number');
            $table->date('date');
            $table->foreignUuid('origin_warehouse_id')->constrained('warehouses');
            $table->foreignUuid('destination_warehouse_id')->constrained('warehouses');
            $table->enum('status', ['draft', 'in_transit', 'received', 'cancelled'])->default('draft');
            $table->foreignUuid('requested_by_user_id')->constrained('users');
            $table->foreignUuid('received_by_user_id')->nullable()->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('transfer_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
