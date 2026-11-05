<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'vendedor', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'cliente', 'guard_name' => 'web']);

        $user = User::firstOrCreate(['email' => 'superadmin@mail.com'], [
            'name' => 'Super Admin',
            'password' => bcrypt('asdf1234'),
        ]);
        $user->assignRole('superadmin');

        $user = User::firstOrCreate(['email' => 'admin@mail.com'], [
            'name' => 'Admin',
            'password' => bcrypt('asdf1234'),
        ]);
        $user->assignRole('admin');

        $user = User::firstOrCreate(['email' => 'vendedor@mail.com'], [
            'name' => 'Vendedor',
            'password' => bcrypt('asdf1234'),
        ]);
        $user->assignRole('vendedor');
    }
}
