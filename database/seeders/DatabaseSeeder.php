<?php

use App\Models\Tenant;
use Database\Seeders\ArticulosTableSeeder;
use Database\Seeders\CentralAdminSeeder;
use Database\Seeders\CategoriasTableSeeder;
use Database\Seeders\ClientesTableSeeder;
use Database\Seeders\InitialSettingsSeeder;
use Database\Seeders\InventariosTableSeeder;
use Database\Seeders\ListaPrecioSeeder;
use Database\Seeders\MarcasTableSeeder;
use Database\Seeders\ProvinciaSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SuppliersTableSeeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\VentasSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── BD CENTRAL ───────────────────────────────────────────────────
        // Solo seeders que operan sobre la BD central (gepetto).
        $this->call(CentralAdminSeeder::class);

        // ── TENANT DE EJEMPLO ────────────────────────────────────────────
        // Crea el tenant "principal" si no existe y lo seedea con datos
        // de negocio dentro de su propia BD aislada.
        $centralDomain = env('CENTRAL_DOMAIN', 'epos.test');
        $subdomain     = 'principal.' . $centralDomain;
        $tenantDb      = env('TENANCY_DB_PREFIX', 'epos_') . 'principal';

        // Si la BD del tenant ya existe (de un migrate:fresh anterior),
        // eliminarla para que stancl pueda recrearla limpiamente.
        DB::statement("DROP DATABASE IF EXISTS `{$tenantDb}`");

        $tenant = Tenant::create([
            'id'          => 'principal',
            'razonsocial' => 'Empresa Principal',
            'cuit'        => '20123456789',
            'plan'        => 'basic',
            'status'      => 'active',
        ]);

        $tenant->domains()->create(['domain' => $subdomain]);

        // Ejecutar seeders de negocio dentro del contexto del tenant
        tenancy()->initialize($tenant);

        try {
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
        } finally {
            tenancy()->end();
        }

        $this->command->info("Tenant '{$subdomain}' listo con todos los datos de ejemplo.");
    }
}
