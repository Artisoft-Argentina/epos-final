<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inicialsettings', function (Blueprint $table) {
            $table->string('iibb')->nullable()->after('condicioniva');
            $table->string('afip_ambiente')->default('homologacion')->after('puntoventa');
        });
    }

    public function down(): void
    {
        Schema::table('inicialsettings', function (Blueprint $table) {
            $table->dropColumn(['iibb', 'afip_ambiente']);
        });
    }
};
