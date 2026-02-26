<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articulo_lista_precio', function (Blueprint $table) {
            $table->id();
            $table->foreignId('articulo_id')->constrained('articulos')->onDelete('cascade');
            $table->foreignId('lista_precio_id')->constrained('listas_precios')->onDelete('cascade');
            $table->decimal('precio', 10, 2);
            $table->timestamps();
            
            $table->unique(['articulo_id', 'lista_precio_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articulo_lista_precio');
    }
};