<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::create([
            'role' => 'superadmin',
            'permission' => 'all',
            'description' => 'Super Administrador con todos los permisos',
        ]);

        Role::create([
            'role' => 'admin',
            'permission' => 'manage_users,manage_products',
            'description' => 'Administrador con permisos de gestión',
        ]);

        Role::create([
            'role' => 'vendedor',
            'permission' => 'view_products,create_sales',
            'description' => 'Vendedor con permisos de ventas',
        ]);

        Role::create([
            'role' => 'cliente',
            'permission' => 'view_shop,create_orders',
            'description' => 'Cliente del e-commerce',
        ]);
    }
}
