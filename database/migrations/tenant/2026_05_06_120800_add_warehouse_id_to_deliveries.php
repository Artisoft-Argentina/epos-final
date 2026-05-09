<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->foreignId('warehouse_id')->nullable()->after('product_id')->constrained('warehouses')->nullOnDelete();
            $table->foreignId('delivered_by_user_id')->nullable()->after('actual_delivery_date')->constrained('users')->nullOnDelete();
        });

        // Backfill: usar el warehouse_id de la sale; si no, el default warehouse
        $defaultWarehouseId = DB::table('warehouses')->where('is_default', true)->value('id');

        DB::statement('
            UPDATE deliveries
            SET warehouse_id = COALESCE(
                (SELECT warehouse_id FROM sales WHERE sales.id = deliveries.sale_id),
                ?
            )
            WHERE warehouse_id IS NULL
        ', [$defaultWarehouseId]);

        if ($defaultWarehouseId) {
            Schema::table('deliveries', function (Blueprint $table) {
                $table->foreignId('warehouse_id')->nullable(false)->change();
            });
        }
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropForeign(['warehouse_id']);
            $table->dropForeign(['delivered_by_user_id']);
            $table->dropColumn(['warehouse_id', 'delivered_by_user_id']);
        });
    }
};
