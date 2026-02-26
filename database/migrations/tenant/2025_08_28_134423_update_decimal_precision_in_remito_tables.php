<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('remitos', function (Blueprint $table) {
            $table->decimal('recargo', 15, 2)->change();
            $table->decimal('bonificacion', 15, 2)->change();
            $table->decimal('subtotal', 15, 2)->change();
            $table->decimal('total', 15, 2)->change();
        });

        Schema::table('articulo_remito', function (Blueprint $table) {
            $table->decimal('bonificacion', 15, 2)->change();
            $table->decimal('alicuota', 8, 2)->change();
            $table->decimal('preciounitario', 15, 2)->change();
            $table->decimal('subtotal', 15, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('remitos', function (Blueprint $table) {
            $table->decimal('recargo', 8, 2)->change();
            $table->decimal('bonificacion', 8, 2)->change();
            $table->decimal('subtotal', 8, 2)->change();
            $table->decimal('total', 8, 2)->change();
        });

        Schema::table('articulo_remito', function (Blueprint $table) {
            $table->decimal('bonificacion', 8, 2)->change();
            $table->decimal('alicuota', 8, 2)->change();
            $table->decimal('preciounitario', 8, 2)->change();
            $table->decimal('subtotal', 8, 2)->change();
        });
    }
};