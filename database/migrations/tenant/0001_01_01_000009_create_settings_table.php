<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('tax_id', 13)->nullable();                    // cuit → tax_id
            $table->string('business_name')->nullable();                  // razonsocial → business_name
            $table->string('address')->nullable();                        // direccion → address
            $table->string('phone')->nullable();                          // telefono → phone
            $table->string('email')->nullable();
            $table->string('zip_code', 10)->nullable();                      // codigopostal → zip_code
            $table->string('city')->nullable();                           // localidad → city
            $table->string('state')->nullable();                          // provincia → state
            $table->string('tax_status')->nullable();                     // condicioniva → tax_status
            $table->string('gross_income_tax')->nullable();               // iibb → gross_income_tax
            $table->string('activity_start_date')->nullable();            // inicioactividades → activity_start_date
            $table->integer('pos_number')->nullable();                    // puntoventa → pos_number
            $table->string('afip_environment')->default('homologacion');  // afip_ambiente → afip_environment
            $table->string('trade_name')->nullable();                     // nombrefantasia → trade_name
            $table->string('commercial_address')->nullable();             // domiciliocomercial → commercial_address
            $table->string('tagline')->nullable();
            $table->string('logo')->nullable();
            $table->bigInteger('next_invoice_number')->nullable();        // numfactura → next_invoice_number
            $table->bigInteger('next_order_number')->nullable();          // numremito → next_order_number
            $table->bigInteger('next_quote_number')->nullable();          // numpresupuesto → next_quote_number
            $table->bigInteger('next_payment_number')->nullable();        // numpago → next_payment_number
            $table->bigInteger('next_receipt_number')->nullable();        // numrecibo → next_receipt_number
            $table->string('mp_access_token')->nullable();
            $table->string('mp_public_key')->nullable();
            $table->string('mp_environment')->default('sandbox');         // mp_ambiente → mp_environment
            $table->softDeletes();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
