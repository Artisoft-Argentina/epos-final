<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Normaliza los estados de venta a los valores de enum en inglés
 * (PaymentStatus / SaleCondition), convirtiendo la data existente.
 * Migración incremental con backfill — NO usar migrate:fresh.
 */
return new class extends Migration
{
    public function up(): void
    {
        // payment_status: 'SI'/'NO' (legacy) -> pending/partial/paid
        DB::statement("UPDATE sales SET payment_status = 'paid' WHERE payment_status = 'SI'");
        DB::statement("UPDATE sales SET payment_status = 'pending' WHERE payment_status = 'NO'");

        // Corregir a 'partial' las ventas con pagos vigentes que no saldan el total
        DB::statement("
            UPDATE sales s SET payment_status = 'partial'
            FROM (
                SELECT sale_id, SUM(amount) AS total_paid
                FROM sale_payments
                WHERE deleted_at IS NULL
                GROUP BY sale_id
            ) p
            WHERE p.sale_id = s.id
              AND p.total_paid > 0
              AND p.total_paid < s.total
              AND s.payment_status <> 'cancelled'
        ");

        // Cualquier valor legacy remanente -> pending (defensivo)
        DB::statement("UPDATE sales SET payment_status = 'pending' WHERE payment_status NOT IN ('pending','partial','paid','cancelled')");

        // sale_condition: 'CONTADO'/'contado'/'CUENTA CORRIENTE' -> cash/credit
        DB::statement("UPDATE sales SET sale_condition = 'cash' WHERE LOWER(sale_condition) = 'contado'");
        DB::statement("UPDATE sales SET sale_condition = 'credit' WHERE UPPER(sale_condition) = 'CUENTA CORRIENTE'");
        DB::statement("UPDATE sales SET sale_condition = 'cash' WHERE sale_condition NOT IN ('cash','credit')");

        // sale_type ya usa 'pos'/'ecommerce' — no requiere conversión.

        // Default de seguridad para inserts futuros (el código siempre setea el valor)
        DB::statement("ALTER TABLE sales ALTER COLUMN payment_status SET DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE sales ALTER COLUMN payment_status DROP DEFAULT");

        DB::statement("UPDATE sales SET sale_condition = 'CONTADO' WHERE sale_condition = 'cash'");
        DB::statement("UPDATE sales SET sale_condition = 'CUENTA CORRIENTE' WHERE sale_condition = 'credit'");

        DB::statement("UPDATE sales SET payment_status = 'SI' WHERE payment_status = 'paid'");
        DB::statement("UPDATE sales SET payment_status = 'NO' WHERE payment_status IN ('pending','partial','cancelled')");
    }
};
