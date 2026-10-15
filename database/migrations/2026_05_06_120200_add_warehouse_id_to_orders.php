<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $defaultWarehouseId = DB::table('warehouses')->where('is_default', true)->value('id');

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('warehouse_id')->nullable()->after('supplier_id')->constrained('warehouses');
        });

        if ($defaultWarehouseId) {
            DB::table('orders')->whereNull('warehouse_id')->update(['warehouse_id' => $defaultWarehouseId]);
        }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('warehouse_id');
        });
    }
};
