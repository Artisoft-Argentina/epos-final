<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('business_name');              // razonsocial → business_name
            $table->string('tax_id', 13)->nullable();      // documentounico → tax_id
            $table->string('address');                     // direccion → address
            $table->string('phone')->nullable();           // telefono → phone
            $table->string('email')->nullable();
            $table->string('zip_code', 10)->nullable();                   // codigopostal → zip_code
            $table->string('city');                        // localidad → city
            $table->string('state');                       // provincia → state
            $table->string('tax_status');                  // condicioniva → tax_status
            $table->decimal('credit', 12, 2)->default(0);  // haber → credit
            $table->boolean('active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
