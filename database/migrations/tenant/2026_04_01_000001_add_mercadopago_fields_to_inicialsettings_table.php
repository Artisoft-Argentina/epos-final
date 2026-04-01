<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inicialsettings', function (Blueprint $table) {
            $table->string('mp_access_token')->nullable()->after('afip_ambiente');
            $table->string('mp_public_key')->nullable()->after('mp_access_token');
            $table->string('mp_ambiente')->default('sandbox')->after('mp_public_key'); // sandbox | production
        });
    }

    public function down(): void
    {
        Schema::table('inicialsettings', function (Blueprint $table) {
            $table->dropColumn(['mp_access_token', 'mp_public_key', 'mp_ambiente']);
        });
    }
};
