<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            // Cambiar tipo a enum con valores definidos
            $table->enum('tipo', [
                'entrada_compra',
                'entrada_asistente',
                'entrada_ajuste',
                'salida_entrega',
                'salida_venta_pos',
                'salida_ajuste',
                'devolucion',
            ])->change();

            // Polimórfico para vincular con Remito, Factura, Entrega, etc.
            $table->string('referenciable_type')->nullable()->after('numcomprobante');
            $table->unsignedBigInteger('referenciable_id')->nullable()->after('referenciable_type');

            // Texto libre para ajustes manuales
            $table->string('motivo')->nullable()->after('referenciable_id');
        });
    }

    public function down(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropColumn(['referenciable_type', 'referenciable_id', 'motivo']);
            $table->string('tipo')->change();
        });
    }
};
