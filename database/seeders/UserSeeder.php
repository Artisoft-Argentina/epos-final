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

        $user = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@mail.com',
            'password' => bcrypt('asdf1234'),
        ]);
        $user->assignRole('superadmin');

        $user = User::create([
            'name' => 'Admin',
            'email' => 'admin@mail.com',
            'password' => bcrypt('asdf1234'),
        ]);
        $user->assignRole('admin');

        $user = User::create([
            'name' => 'Vendedor',
            'email' => 'vendedor@mail.com',
            'password' => bcrypt('asdf1234'),
        ]);
        $user->assignRole('vendedor');
    }
}
