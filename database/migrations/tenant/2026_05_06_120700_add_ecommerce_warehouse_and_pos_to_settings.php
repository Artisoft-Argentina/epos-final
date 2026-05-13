<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->foreignId('default_ecommerce_warehouse_id')->nullable()->after('mp_environment')->constrained('warehouses')->nullOnDelete();
            $table->foreignId('default_ecommerce_point_of_sale_id')->nullable()->after('default_ecommerce_warehouse_id')->constrained('points_of_sale')->nullOnDelete();
        });

        $defaultWarehouseId = DB::table('warehouses')->where('is_default', true)->value('id');
        $defaultPosId       = DB::table('points_of_sale')->where('is_default', true)->value('id');

        if ($defaultWarehouseId || $defaultPosId) {
            DB::table('settings')->update([
                'default_ecommerce_warehouse_id'     => $defaultWarehouseId,
                'default_ecommerce_point_of_sale_id' => $defaultPosId,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropForeign(['default_ecommerce_warehouse_id']);
            $table->dropForeign(['default_ecommerce_point_of_sale_id']);
            $table->dropColumn(['default_ecommerce_warehouse_id', 'default_ecommerce_point_of_sale_id']);
        });
    }
};
