<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('provincias', function (Blueprint $table) {
            $table->integer('id_afip')->nullable()->after('nombre');
        });

        Schema::table('localidades', function (Blueprint $table) {
            $table->integer('id_afip')->nullable()->after('provincia_id');
        });
    }

    public function down(): void
    {
        Schema::table('provincias', function (Blueprint $table) {
            $table->dropColumn('id_afip');
        });

        Schema::table('localidades', function (Blueprint $table) {
            $table->dropColumn('id_afip');
        });
    }
};