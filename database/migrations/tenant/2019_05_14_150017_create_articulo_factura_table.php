<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateArticuloFacturaTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('articulo_factura', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('codprov')->nullable();
            $table->string('codarticulo');
            $table->string('articulo');
            $table->string('medida');
            $table->integer('cantidad');
            $table->decimal('bonificacion', 8, 2);
            $table->decimal('alicuota', 8, 2);
            $table->decimal('preciounitario', 8, 2);
            $table->decimal('subtotal', 8, 2);
            $table->unsignedBigInteger('articulo_id');
            $table->unsignedBigInteger('factura_id');
            $table->timestamps();

            $table->foreign('articulo_id')->references('id')->on('articulos');
            $table->foreign('factura_id')->references('id')->on('facturas');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('articulo_factura');
    }
}
