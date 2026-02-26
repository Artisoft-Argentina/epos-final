<?php

namespace Database\Seeders;

use App\Models\Central\CentralUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CentralAdminSeeder extends Seeder
{
    public function run(): void
    {
        CentralUser::firstOrCreate(
            ['email' => 'superadmin@epos.local'],
            [
                'name'     => 'Super Admin',
                'password' => Hash::make('superadmin123'),
            ]
        );

        $this->command->info('Superadmin central creado: superadmin@epos.local / superadmin123');
    }
}
