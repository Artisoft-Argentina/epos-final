<?php

namespace Database\Seeders;

use App\Models\PointOfSale;
use App\Models\State;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class TenantInitSeeder extends Seeder
{
    public function run(): void
    {
        if (State::count() === 0) {
            $this->call(StatesSeeder::class);
        }

        if (! Warehouse::isDefault()->exists()) {
            Warehouse::create([
                'name'       => 'Principal',
                'code'       => 'PRINCIPAL',
                'is_default' => true,
                'active'     => true,
            ]);
        }

        if (! PointOfSale::where('is_default', true)->exists()) {
            $warehouse = Warehouse::isDefault()->first();
            PointOfSale::create([
                'name'                   => 'Principal',
                'pos_number'             => 1,
                'warehouse_id'           => $warehouse->id,
                'voucher_letter_default' => 'B',
                'is_default'             => true,
                'active'                 => true,
            ]);
        }
    }
}
