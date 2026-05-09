<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\PriceList;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class E2ESeeder extends Seeder
{
    public function run(): void
    {
        $clienteRole = Role::where('role', 'cliente')->first();

        if ($clienteRole) {
            User::firstOrCreate(
                ['email' => 'cliente.e2e@mail.com'],
                [
                    'name'     => 'Cliente E2E',
                    'password' => Hash::make('asdf1234'),
                    'role_id'  => $clienteRole->id,
                ]
            );
        }

        Customer::firstOrCreate(
            ['tax_id' => '30000000007'],
            [
                'business_name' => 'Cliente E2E SA',
                'fantasy_name'  => 'Cliente E2E',
                'person_type'   => 'juridica',
                'email'         => 'cliente.e2e@mail.com',
                'phone'         => '11-0000-0000',
                'address'       => 'Calle Falsa 123',
                'tax_status'    => 'Responsable Inscripto',
                'active'        => true,
            ]
        );

        // Catálogo mínimo para que los specs de products/sales no necesiten --with-demo.
        Brand::firstOrCreate(['name' => 'E2E Brand'], ['active' => true]);
        Category::firstOrCreate(['name' => 'E2E Category'], ['active' => true]);

        Supplier::firstOrCreate(
            ['tax_id' => '30000000015'],
            [
                'business_name' => 'Proveedor E2E SA',
                'phone'         => '11-1111-1111',
                'email'         => 'proveedor.e2e@mail.com',
                'address'       => 'Av. Test 456',
                'active'        => true,
            ]
        );

        if (! PriceList::where('default_pos', true)->exists()) {
            PriceList::create([
                'name'              => 'Lista E2E POS',
                'percentage'        => 0,
                'default_pos'       => true,
                'default_ecommerce' => false,
                'active'            => true,
            ]);
        }

        if (! PriceList::where('default_ecommerce', true)->exists()) {
            PriceList::create([
                'name'              => 'Lista E2E Web',
                'percentage'        => 10,
                'default_pos'       => false,
                'default_ecommerce' => true,
                'active'            => true,
            ]);
        }
    }
}
