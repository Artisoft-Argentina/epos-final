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
            $table->string('tax_id', 13);                   // cuit → tax_id
            $table->date('date');                                    // fecha → date
            $table->decimal('discount', 12, 2);             // bonificacion → discount
            $table->decimal('surcharge', 12, 2);            // recargo → surcharge
            $table->decimal('subtotal', 12, 2);
            $table->decimal('total', 12, 2);
            $table->date('expiration_date')->nullable();  // vencimiento → expiration_date
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
