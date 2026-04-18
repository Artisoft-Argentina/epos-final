<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->integer('pos_number');                  // ptoventa → pos_number
            $table->string('voucher_letter');               // letracomprobante → voucher_letter
            $table->integer('quote_number');                // numpresupuesto → quote_number
            $table->bigInteger('tax_id');                   // cuit → tax_id
            $table->string('date');                         // fecha → date
            $table->decimal('discount', 8, 2);             // bonificacion → discount
            $table->decimal('surcharge', 8, 2);            // recargo → surcharge
            $table->decimal('subtotal', 8, 2);
            $table->decimal('total', 8, 2);
            $table->string('expiration_date')->nullable();  // vencimiento → expiration_date
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
