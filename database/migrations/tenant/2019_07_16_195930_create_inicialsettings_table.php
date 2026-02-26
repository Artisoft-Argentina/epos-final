<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInicialsettingsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('inicialsettings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('cuit')->nullable();
            $table->string('razonsocial')->nullable();
            $table->string('direccion')->nullable();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->integer('codigopostal')->nullable();
            $table->string('localidad')->nullable();
            $table->string('provincia')->nullable();
            $table->string('condicioniva')->nullable();
            $table->string('inicioactividades')->nullable();
            $table->integer('puntoventa')->nullable();
            $table->string('nombrefantasia')->nullable();
            $table->string('domiciliocomercial')->nullable();
            $table->string('tagline')->nullable();
            $table->bigInteger('numfactura')->nullable();
            $table->bigInteger('numremito')->nullable();
            $table->bigInteger('numpresupuesto')->nullable();
            $table->bigInteger('numpago')->nullable();
            $table->bigInteger('numrecibo')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('inicialsettings');
    }
}
