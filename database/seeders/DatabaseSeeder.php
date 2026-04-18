<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── BD CENTRAL ───────────────────────────────────────────────────
        $this->call(CentralAdminSeeder::class);

        // ── TENANT DE EJEMPLO ────────────────────────────────────────────
        $centralDomain = env('CENTRAL_DOMAIN', 'epos.test');
        $subdomain     = 'principal.' . $centralDomain;
        $tenantDb      = env('TENANCY_DB_PREFIX', 'epos_') . 'principal';

        $existing = Tenant::find('principal');
        try {
            // Limpiar BD del tenant con cualquier prefijo que pudiera existir
            DB::statement("DROP DATABASE IF EXISTS `{$tenantDb}`");
            DB::statement("DROP DATABASE IF EXISTS `tenant_principal`");
            if ($existing) {
                $existing->domains()->delete();
                $existing->delete();
            }
        } catch (\Throwable $th) {
            //
        }

        $tenant = Tenant::create([
            'id'            => 'principal',
            'business_name' => 'Empresa Principal',
            'tax_id'        => '20123456789',
            'plan'          => 'basic',
            'status'        => 'active',
        ]);

        $tenant->domains()->create(['domain' => $subdomain]);

        tenancy()->initialize($tenant);

        try {
            $this->call([
                RoleSeeder::class,
                UserSeeder::class,
                StatesSeeder::class,
                SettingsSeeder::class,
            ]);
        } finally {
            tenancy()->end();
        }

        $this->command->info("Tenant '{$subdomain}' listo.");
    }
}
