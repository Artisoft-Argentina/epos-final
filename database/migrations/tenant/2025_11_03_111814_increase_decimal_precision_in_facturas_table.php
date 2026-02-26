<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('facturas', function (Blueprint $table) {
            $table->decimal('subtotal', 12, 2)->change();
            $table->decimal('total', 12, 2)->change();
            $table->decimal('recargo', 12, 2)->change();
            $table->decimal('descuento', 12, 2)->change();
            $table->decimal('bonificacion', 12, 2)->change();
        });
    }

    public function down()
    {
        Schema::table('facturas', function (Blueprint $table) {
            $table->decimal('subtotal', 8, 2)->change();
            $table->decimal('total', 8, 2)->change();
            $table->decimal('recargo', 8, 2)->change();
            $table->decimal('descuento', 8, 2)->change();
            $table->decimal('bonificacion', 8, 2)->change();
        });
    }
};