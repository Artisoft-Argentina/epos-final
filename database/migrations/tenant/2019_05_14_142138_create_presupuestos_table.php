<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePresupuestosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('presupuestos', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->integer('ptoventa');
            $table->integer('numpresupuesto');
            $table->bigInteger('cuit');
            $table->string('fecha');
            $table->decimal('bonificacion', 8, 2);
            $table->decimal('recargo', 8, 2);
            $table->decimal('subtotal', 8, 2);
            $table->decimal('total', 8, 2);
            $table->string('vencimiento')->nullable();
            $table->UnsignedBigInteger('cliente_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('cliente_id')->references('id')->on('clientes');
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
        Schema::dropIfExists('presupuestos');
    }
}
