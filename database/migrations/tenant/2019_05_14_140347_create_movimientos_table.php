<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMovimientosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('movimientos', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('tipo');
            $table->integer('cantidad');
            $table->string('fecha');
            $table->unsignedBigInteger('inventario_id');
            $table->bigInteger('numcomprobante')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->foreign('inventario_id')->references('id')->on('inventarios');
            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('movimientos');
    }
}
