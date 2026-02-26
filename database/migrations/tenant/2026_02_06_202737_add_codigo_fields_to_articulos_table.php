<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('articulos', function (Blueprint $table) {
            $table->string('codigo_barras')->nullable()->unique()->after('codarticulo');
            $table->string('codigo_qr')->nullable()->unique()->after('codigo_barras');
        });
    }

    public function down()
    {
        Schema::table('articulos', function (Blueprint $table) {
            $table->dropColumn(['codigo_barras', 'codigo_qr']);
        });
    }
};