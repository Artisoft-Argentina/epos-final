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
            $table->string('business_name');
            $table->string('fantasy_name')->nullable();
            $table->string('person_type', 20)->default('fisica'); // 'fisica' / 'juridica'
            $table->string('tax_id', 13)->nullable();              // CUIT/CUIL — requerido si juridica
            $table->string('dni', 8)->nullable();                  // DNI — requerido si fisica
            $table->string('phone')->nullable();
            $table->string('cellphone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('zip_code', 10)->nullable();
            $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();
            $table->foreignId('state_id')->nullable()->constrained('states')->nullOnDelete();
            $table->string('tax_status');                          // condición IVA — NOT NULL
            $table->string('fiscal_name')->nullable();             // V2 AFIP
            $table->string('fiscal_address')->nullable();          // V2 AFIP
            $table->text('notes')->nullable();
            $table->decimal('credit', 12, 2)->default(0);
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
