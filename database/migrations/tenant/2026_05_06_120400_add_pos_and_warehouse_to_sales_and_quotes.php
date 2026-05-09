<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $defaultPosId       = DB::table('points_of_sale')->where('is_default', true)->value('id');
        $defaultWarehouseId = DB::table('warehouses')->where('is_default', true)->value('id');

        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('point_of_sale_id')->nullable()->after('user_id')->constrained('points_of_sale')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->after('point_of_sale_id')->constrained('warehouses')->nullOnDelete();
        });

        if ($defaultPosId) {
            DB::table('sales')->update(['point_of_sale_id' => $defaultPosId]);
        }
        if ($defaultWarehouseId) {
            DB::table('sales')->update(['warehouse_id' => $defaultWarehouseId]);
        }

        if (Schema::hasTable('quotes')) {
            Schema::table('quotes', function (Blueprint $table) {
                $table->foreignId('point_of_sale_id')->nullable()->constrained('points_of_sale')->nullOnDelete();
                $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            });

            if ($defaultPosId) {
                DB::table('quotes')->update(['point_of_sale_id' => $defaultPosId]);
            }
            if ($defaultWarehouseId) {
                DB::table('quotes')->update(['warehouse_id' => $defaultWarehouseId]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['point_of_sale_id']);
            $table->dropForeign(['warehouse_id']);
            $table->dropColumn(['point_of_sale_id', 'warehouse_id']);
        });

        if (Schema::hasTable('quotes')) {
            Schema::table('quotes', function (Blueprint $table) {
                $table->dropForeign(['point_of_sale_id']);
                $table->dropForeign(['warehouse_id']);
                $table->dropColumn(['point_of_sale_id', 'warehouse_id']);
            });
        }
    }
};
