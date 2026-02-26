<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMovimientocuentasTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('movimientocuentas', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('ctacte_id');
            $table->string('tipo');
            $table->string('fecha');
            $table->float('importe');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->foreign('ctacte_id')->references('id')->on('cuentacorrientes');
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
        Schema::dropIfExists('movimientocuentas');
    }
}
