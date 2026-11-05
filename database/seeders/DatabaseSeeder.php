<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            InitSeeder::class,
            SettingsSeeder::class,
        ]);

        $this->seedSuperadmin();

        // Usuarios demo solo fuera de producción.
        if (! app()->isProduction()) {
            $this->call(UserSeeder::class);
        }
    }

    private function seedSuperadmin(): void
    {
        // En producción las credenciales son obligatorias (fail-fast: mejor romper
        // que crear un superadmin con un password default conocido).
        if (app()->isProduction() && (blank(env('SUPERADMIN_EMAIL')) || blank(env('SUPERADMIN_PASSWORD')))) {
            throw new \RuntimeException(
                'SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD son requeridas en producción. Configuralas en el .env del servidor.'
            );
        }

        // En dev/qa caen a un default demo por comodidad.
        // `?:` y no el default de env(): en el .env las variables existen pero vacías.
        $email = env('SUPERADMIN_EMAIL') ?: 'principal@mail.com';

        User::firstOrCreate(
            ['email' => $email],
            [
                'name'     => env('SUPERADMIN_NAME') ?: 'Super Admin',
                'password' => Hash::make(env('SUPERADMIN_PASSWORD') ?: 'superadmin123'),
            ]
        )->assignRole('superadmin');

        $this->command->info("Superadmin: {$email}");
    }
}
