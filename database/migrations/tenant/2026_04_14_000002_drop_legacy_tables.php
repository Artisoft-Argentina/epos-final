<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tablas del sistema de cuenta corriente / pagos / recibos original.
     * Fueron reemplazadas por factura_pagos en el rediseño actual.
     * Tienen 0 filas y ningún modelo ni controlador activo las referencia.
     */
    private array $legacyTables = [
        'pago_recibo',        // pivot del sistema antiguo
        'recibos',            // reemplazado por factura_pagos
        'pagos',              // reemplazado por factura_pagos
        'movimientocuentas',  // movimientos del ctacte antiguo
        'cuentacorrientes',   // cuenta corriente antigua
        'password_resets',    // reemplazado por password_reset_tokens (Laravel actual)
    ];

    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        foreach ($this->legacyTables as $table) {
            Schema::dropIfExists($table);
        }

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // No se recrea: estas tablas son basura legacy sin datos.
        // Si necesitás recuperarlas, restaurá desde un backup.
    }
};
