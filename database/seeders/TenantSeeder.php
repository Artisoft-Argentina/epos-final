<?php

namespace Database\Seeders;

use Database\Seeders\RoleSeeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\ProvinciaSeeder;
use Database\Seeders\CategoriasTableSeeder;
use Database\Seeders\MarcasTableSeeder;
use Database\Seeders\SuppliersTableSeeder;
use Database\Seeders\ArticulosTableSeeder;
use Database\Seeders\ClientesTableSeeder;
use Database\Seeders\InventariosTableSeeder;
use Database\Seeders\InitialSettingsSeeder;
use Database\Seeders\ListaPrecioSeeder;
use Database\Seeders\VentasSeeder;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            ProvinciaSeeder::class,
            CategoriasTableSeeder::class,
            MarcasTableSeeder::class,
            SuppliersTableSeeder::class,
            ArticulosTableSeeder::class,
            ClientesTableSeeder::class,
            InventariosTableSeeder::class,
            InitialSettingsSeeder::class,
            ListaPrecioSeeder::class,
            VentasSeeder::class,
        ]);
    }
}
