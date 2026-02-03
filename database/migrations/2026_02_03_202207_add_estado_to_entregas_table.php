<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('entregas', function (Blueprint $table) {
            $table->enum('estado', ['pendiente', 'entregada', 'cancelada'])->default('pendiente')->after('observaciones');
            $table->timestamp('fecha_entrega_real')->nullable()->after('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('entregas', function (Blueprint $table) {
            $table->dropColumn(['estado', 'fecha_entrega_real']);
        });
    }
};
