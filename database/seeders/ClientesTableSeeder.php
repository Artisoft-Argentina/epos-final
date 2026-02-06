<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;

class ClientesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $clienteRole = Role::where('role', 'cliente')->first();

        // CUITs de prueba para AFIP Homologación
        // Estos CUITs son reconocidos por el entorno de testing de AFIP
        $clientes = [
            [
                'razonsocial' => 'CONSUMIDOR FINAL',
                'documentounico' => 0,
                'direccion' => 'N/D',
                'telefono' => 'N/D',
                'email' => null,
                'codigopostal' => 0,
                'localidad' => 'N/D',
                'provincia' => 'N/D',
                'condicioniva' => 'Consumidor Final',
            ],
            [
                'razonsocial' => 'AFIP Test - Responsable Inscripto',
                'documentounico' => 20000000001, // CUIT test AFIP
                'direccion' => 'Av. Test 1234',
                'telefono' => '011-4567-8901',
                'email' => 'resp.inscripto@test.com',
                'codigopostal' => 1043,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'Responsable Inscripto',
            ],
            [
                'razonsocial' => 'AFIP Test - Monotributista',
                'documentounico' => 20000000002, // CUIT test AFIP
                'direccion' => 'Av. Test 5678',
                'telefono' => '011-2345-6789',
                'email' => 'monotributo@test.com',
                'codigopostal' => 1425,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'Monotributo',
            ],
            [
                'razonsocial' => 'AFIP Test - Exento',
                'documentounico' => 20000000003, // CUIT test AFIP
                'direccion' => 'Av. Test 9876',
                'telefono' => '011-8765-4321',
                'email' => 'exento@test.com',
                'codigopostal' => 1406,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'Exento',
            ],
            [
                'razonsocial' => 'Empresa Test SA',
                'documentounico' => 30000000001, // CUIT empresa test AFIP
                'direccion' => 'Av. Empresarial 3456',
                'telefono' => '011-5432-1098',
                'email' => 'empresa@test.com',
                'codigopostal' => 1428,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'Responsable Inscripto',
            ],
            [
                'razonsocial' => 'García, María Elena',
                'documentounico' => 27000000014, // CUIT test AFIP femenino
                'direccion' => 'Av. Corrientes 1234',
                'telefono' => '011-4567-8901',
                'email' => 'maria.garcia@email.com',
                'codigopostal' => 1043,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'Responsable Inscripto',
            ],
            [
                'razonsocial' => 'Rodríguez, Carlos Alberto',
                'documentounico' => 20111111112, // CUIT test AFIP
                'direccion' => 'Av. Santa Fe 5678',
                'telefono' => '011-2345-6789',
                'email' => 'carlos.rodriguez@email.com',
                'codigopostal' => 1425,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'Monotributo',
            ],
        ];

        foreach ($clientes as $cliente) {
            $clienteCreado = Cliente::create($cliente);
            
            // Crear usuario solo si el cliente tiene email
            if ($clienteCreado->email) {
                User::create([
                    'name' => $clienteCreado->razonsocial,
                    'email' => $clienteCreado->email,
                    'password' => bcrypt('asdf1234'),
                    'role_id' => $clienteRole->id,
                ]);
            }
        }
    }
}
