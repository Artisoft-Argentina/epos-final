<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Normaliza los estados de venta a los valores de enum en inglés
 * (PaymentStatus / SaleCondition), convirtiendo la data existente.
 * Migración incremental con backfill — NO usar migrate:fresh.
 *
 * Escrita con el query builder (no SQL crudo) para que corra igual en
 * PostgreSQL (todos los ambientes reales) y SQLite (tests).
 */
return new class extends Migration
{
    public function up(): void
    {
        // payment_status: 'SI'/'NO' (legacy) -> pending/partial/paid
        DB::table('sales')->where('payment_status', 'SI')->update(['payment_status' => 'paid']);
        DB::table('sales')->where('payment_status', 'NO')->update(['payment_status' => 'pending']);

        // Corregir a 'partial' las ventas con pagos vigentes que no saldan el total
        $totalsPaid = DB::table('sale_payments')
            ->whereNull('deleted_at')
            ->groupBy('sale_id')
            ->selectRaw('sale_id, SUM(amount) as total_paid')
            ->havingRaw('SUM(amount) > 0') // Postgres no permite el alias del SELECT en HAVING
            ->get();

        foreach ($totalsPaid as $row) {
            DB::table('sales')
                ->where('id', $row->sale_id)
                ->where('payment_status', '<>', 'cancelled')
                ->where('total', '>', $row->total_paid)
                ->update(['payment_status' => 'partial']);
        }

        // Cualquier valor legacy remanente -> pending (defensivo)
        DB::table('sales')
            ->whereNotIn('payment_status', ['pending', 'partial', 'paid', 'cancelled'])
            ->update(['payment_status' => 'pending']);

        // sale_condition: 'CONTADO'/'contado'/'CUENTA CORRIENTE' -> cash/credit
        DB::table('sales')->whereRaw('LOWER(sale_condition) = ?', ['contado'])->update(['sale_condition' => 'cash']);
        DB::table('sales')->whereRaw('UPPER(sale_condition) = ?', ['CUENTA CORRIENTE'])->update(['sale_condition' => 'credit']);
        DB::table('sales')->whereNotIn('sale_condition', ['cash', 'credit'])->update(['sale_condition' => 'cash']);

        // sale_type ya usa 'pos'/'ecommerce' — no requiere conversión.

        // Default de seguridad para inserts futuros (el código siempre setea el valor).
        // ALTER COLUMN ... SET DEFAULT es sintaxis de Postgres; se omite en otros drivers (tests en SQLite).
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE sales ALTER COLUMN payment_status SET DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE sales ALTER COLUMN payment_status DROP DEFAULT');
        }

        DB::table('sales')->where('sale_condition', 'cash')->update(['sale_condition' => 'CONTADO']);
        DB::table('sales')->where('sale_condition', 'credit')->update(['sale_condition' => 'CUENTA CORRIENTE']);

        DB::table('sales')->where('payment_status', 'paid')->update(['payment_status' => 'SI']);
        DB::table('sales')->whereIn('payment_status', ['pending', 'partial', 'cancelled'])->update(['payment_status' => 'NO']);
    }
};
