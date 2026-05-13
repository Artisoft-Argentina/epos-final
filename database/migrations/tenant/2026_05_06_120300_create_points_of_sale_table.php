<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('points_of_sale', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedSmallInteger('pos_number');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->char('voucher_letter_default', 1)->default('B');
            $table->unsignedBigInteger('next_invoice_number_a')->default(1);
            $table->unsignedBigInteger('next_invoice_number_b')->default(1);
            $table->unsignedBigInteger('next_invoice_number_c')->default(1);
            $table->boolean('is_default')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unique('pos_number');
            $table->index('is_default');
        });

        $defaultWarehouseId = DB::table('warehouses')->where('is_default', true)->value('id')
            ?? DB::table('warehouses')->orderBy('id')->value('id');

        if ($defaultWarehouseId) {
            $existingPosNumber = DB::table('settings')->value('pos_number') ?? 3;
            $nextA = (int) (DB::table('sales')->where('voucher_letter', 'A')->max('invoice_number') ?? 0) + 1;
            $nextB = (int) (DB::table('sales')->where('voucher_letter', 'B')->max('invoice_number') ?? 0) + 1;
            $nextC = (int) (DB::table('sales')->where('voucher_letter', 'C')->max('invoice_number') ?? 0) + 1;

            DB::table('points_of_sale')->insert([
                'name'                   => 'Principal',
                'pos_number'             => $existingPosNumber,
                'warehouse_id'           => $defaultWarehouseId,
                'voucher_letter_default' => 'B',
                'next_invoice_number_a'  => $nextA,
                'next_invoice_number_b'  => $nextB,
                'next_invoice_number_c'  => $nextC,
                'is_default'             => true,
                'active'                 => true,
                'created_at'             => now(),
                'updated_at'             => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('points_of_sale');
    }
};
