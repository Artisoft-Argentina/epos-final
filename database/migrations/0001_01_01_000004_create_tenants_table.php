<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('business_name')->nullable();  // razonsocial → business_name
            $table->string('tax_id', 20)->nullable();      // cuit → tax_id
            $table->string('plan', 20)->default('basic');
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->json('data')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
