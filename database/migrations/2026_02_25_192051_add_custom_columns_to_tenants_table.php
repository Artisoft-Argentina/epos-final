<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('razonsocial')->nullable()->after('id');
            $table->string('cuit', 20)->nullable()->after('razonsocial');
            $table->string('plan', 20)->default('basic')->after('cuit');
            $table->string('status', 20)->default('active')->after('plan');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['razonsocial', 'cuit', 'plan', 'status']);
        });
    }
};
