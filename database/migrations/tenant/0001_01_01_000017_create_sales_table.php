<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->integer('pos_number');                                  // ptoventa → pos_number
            $table->integer('voucher_code')->nullable();                    // codcomprobante → voucher_code
            $table->string('voucher_letter');                               // letracomprobante → voucher_letter
            $table->unsignedInteger('invoice_number');                           // numfactura → invoice_number
            $table->string('tax_id', 13);                                   // cuit → tax_id
            $table->date('date');                                         // fecha → date
            $table->decimal('discount', 12, 2);                            // bonificacion → discount
            $table->decimal('surcharge', 12, 2);                           // recargo → surcharge
            $table->decimal('additional_discount', 12, 2)->default(0);    // descuento → additional_discount
            $table->decimal('subtotal', 12, 2);
            $table->decimal('total', 12, 2);
            $table->string('payment_status');                               // pagada → payment_status
            $table->string('sale_condition');                               // condicionventa → sale_condition
            $table->string('afip_voucher', 20)->nullable();                 // comprobanteafip → afip_voucher
            $table->string('cae', 50)->nullable();
            $table->date('cae_expiration')->nullable();                   // vencimiento_cae → cae_expiration
            $table->date('due_date')->nullable();                           // fechavto → due_date
            $table->string('barcode_string')->nullable();                   // codbarra → barcode_string
            $table->string('payment_code')->nullable();                     // compago → payment_code
            $table->string('sale_type')->default('pos'); // valores: pos, ecommerce
            $table->boolean('afip_authorized')->default(false);            // autorizada_afip → afip_authorized
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('price_list_id')->nullable()->constrained('price_lists')->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
