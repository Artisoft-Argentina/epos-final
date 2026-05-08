<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('point_of_sale_id')->nullable()->after('role_id')->constrained('points_of_sale')->nullOnDelete();
        });

        // Backfill: vendedores existentes → PV default. Admins/superadmin → null.
        $vendedorRoleId = DB::table('roles')->where('role', 'vendedor')->value('id');
        $defaultPosId   = DB::table('points_of_sale')->where('is_default', true)->value('id');

        if ($vendedorRoleId && $defaultPosId) {
            DB::table('users')
                ->where('role_id', $vendedorRoleId)
                ->whereNull('point_of_sale_id')
                ->update(['point_of_sale_id' => $defaultPosId]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['point_of_sale_id']);
            $table->dropColumn('point_of_sale_id');
        });
    }
};
