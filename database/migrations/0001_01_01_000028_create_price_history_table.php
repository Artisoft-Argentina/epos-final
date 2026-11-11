<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('price_list_id')->nullable()->constrained('price_lists')->nullOnDelete();
            $table->enum('type', ['cost_update', 'price_override', 'bulk_recalculation']);
            $table->decimal('old_value', 12, 2);
            $table->decimal('new_value', 12, 2);
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_history');
    }
};
