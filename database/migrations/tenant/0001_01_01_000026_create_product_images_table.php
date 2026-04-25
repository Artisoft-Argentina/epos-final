<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('filename');                        // nombre_archivo → filename
            $table->string('path');                            // ruta → path
            $table->string('thumbnail_path')->nullable();      // ruta_thumb → thumbnail_path
            $table->boolean('is_primary')->default(false);    // es_principal → is_primary
            $table->integer('sort_order')->default(0);         // orden → sort_order
            $table->softDeletes();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_images');
    }
};
