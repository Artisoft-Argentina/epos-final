<?php

namespace Database\Seeders;

use App\Models\Central\CentralUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CentralAdminSeeder extends Seeder
{
    public function run(): void
    {
        // En producción las credenciales son obligatorias (fail-fast: mejor romper
        // que crear un superadmin con un password default conocido).
        if (app()->isProduction() && (blank(env('SUPERADMIN_EMAIL')) || blank(env('SUPERADMIN_PASSWORD')))) {
            throw new \RuntimeException(
                'SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD son requeridas en producción. Configuralas en el .env del servidor.'
            );
        }

        // En dev/qa caen a un default demo por comodidad.
        $email    = env('SUPERADMIN_EMAIL', 'principal@mail.com');
        $password = env('SUPERADMIN_PASSWORD', 'superadmin123');
        $name     = env('SUPERADMIN_NAME', 'Super Admin');

        CentralUser::firstOrCreate(
            ['email' => $email],
            [
                'name'     => $name,
                'password' => Hash::make($password),
            ]
        );

        $this->command->info("Superadmin central: {$email}");
    }
}
