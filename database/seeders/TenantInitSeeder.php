<?php

namespace Database\Seeders;

use App\Models\Provincia;
use Illuminate\Database\Seeder;

class TenantInitSeeder extends Seeder
{
    public function run(): void
    {
        // Solo ejecutar si la tabla está vacía para evitar duplicados
        if (Provincia::count() === 0) {
            $this->call(ProvinciaSeeder::class);
        }

        $this->call(ProvinciasAfipSeeder::class);
    }
}
