<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->string('name');                                                          // nombre → name
            $table->foreignId('state_id')->constrained('states')->cascadeOnDelete();        // provincia_id → state_id
            $table->integer('afip_id')->nullable();                                          // id_afip → afip_id
            $table->softDeletes();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};
