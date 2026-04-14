<?php

namespace Tests;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/**
 * Clase base para tests que requieren contexto de tenant.
 *
 * Usa SQLite para ambas bases de datos:
 * - Central:  :memory: (reseteada con migrate:fresh en cada test)
 * - Tenant:   archivo SQLite en database/epos_test (creado por SQLiteDatabaseManager)
 *
 * Al terminar cada test destruye el archivo SQLite del tenant.
 */
abstract class TenantTestCase extends TestCase
{
    protected Tenant $tenant;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Resetear la BD central (:memory: ya es vacía, pero migrate:fresh
        // garantiza que todas las migraciones centrales queden aplicadas)
        Artisan::call('migrate:fresh');

        // Crear tenant de test en la BD central
        $this->tenant = Tenant::create([
            'id'          => 'test',
            'razonsocial' => 'Empresa Test',
            'cuit'        => '30000000000',
            'plan'        => 'basico',
            'status'      => 'active',
        ]);

        $this->tenant->domains()->create(['domain' => 'test.epos.lvh.me']);

        // Inicializar tenancy:
        // - SQLiteDatabaseManager crea el archivo database/epos_test
        // - DatabaseTenancyBootstrapper cambia la conexión default a "tenant"
        tenancy()->initialize($this->tenant);

        // Correr migraciones tenant sobre el SQLite del tenant
        Artisan::call('tenants:migrate', ['--tenants' => ['test']]);

        // Crear rol admin y usuario admin disponibles en todos los tenant tests
        $role = \App\Models\Role::firstOrCreate(
            ['role' => 'admin'],
            ['description' => 'Administrador']
        );

        $this->adminUser = User::factory()->create([
            'email'   => 'admin@test.com',
            'role_id' => $role->id,
        ]);
    }

    protected function tearDown(): void
    {
        // tenancy()->end() hace DB::purge('tenant') y restaura la conexión central
        tenancy()->end();

        // Eliminar el archivo SQLite del tenant (liberado por el purge anterior)
        $tenantDbPath = database_path(
            config('tenancy.database.prefix') . 'test'
        );
        if (file_exists($tenantDbPath)) {
            unlink($tenantDbPath);
        }

        parent::tearDown();
    }
}
