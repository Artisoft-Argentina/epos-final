<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('facturas', function (Blueprint $table) {
            $table->foreignId('lista_precio_id')->nullable()->constrained('listas_precios')->onDelete('set null');
            $table->enum('tipo_venta', ['pos', 'ecommerce'])->default('pos');
        });
    }

    public function down(): void
    {
        Schema::table('facturas', function (Blueprint $table) {
            $table->dropForeign(['lista_precio_id']);
            $table->dropColumn(['lista_precio_id', 'tipo_venta']);
        });
    }
};