<?php

use App\Models\Warehouse;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Asegurar que exista un almacén default antes del backfill
        $defaultWarehouseId = DB::table('warehouses')->where('is_default', true)->value('id');
        if (! $defaultWarehouseId) {
            $defaultWarehouseId = DB::table('warehouses')->insertGetId([
                'name'       => 'Principal',
                'code'       => 'PRINCIPAL',
                'is_default' => true,
                'active'     => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Schema::table('stocks', function (Blueprint $table) {
            $table->foreignId('warehouse_id')->nullable()->after('product_id')->constrained('warehouses');
        });

        DB::table('stocks')->whereNull('warehouse_id')->update(['warehouse_id' => $defaultWarehouseId]);

        Schema::table('stocks', function (Blueprint $table) {
            $table->foreignId('warehouse_id')->nullable(false)->change();
            $table->dropUnique(['product_id']);
            $table->unique(['product_id', 'warehouse_id'], 'stocks_product_warehouse_unique');
        });
    }

    public function down(): void
    {
        Schema::table('stocks', function (Blueprint $table) {
            $table->dropUnique('stocks_product_warehouse_unique');
            $table->dropConstrainedForeignId('warehouse_id');
            $table->unique('product_id');
        });
    }
};
