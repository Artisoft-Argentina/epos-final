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
                'condicioniva' => 'CONSUMIDOR FINAL',
            ],
            [
                'razonsocial' => 'García, María Elena',
                'documentounico' => 20002307554,
                'direccion' => 'Av. Corrientes 1234',
                'telefono' => '011-4567-8901',
                'email' => 'maria.garcia@email.com',
                'codigopostal' => 1043,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'RESPONSABLE INSCRIPTO',
            ],
            [
                'razonsocial' => 'Rodríguez, Carlos Alberto',
                'documentounico' => 20002460123,
                'direccion' => 'Av. Santa Fe 5678',
                'telefono' => '011-2345-6789',
                'email' => 'carlos.rodriguez@email.com',
                'codigopostal' => 1425,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'MONOTRIBUTO',
            ],
            [
                'razonsocial' => 'López, Ana Sofía',
                'documentounico' => 20188192514,
                'direccion' => 'Av. Rivadavia 9876',
                'telefono' => '011-8765-4321',
                'email' => 'ana.lopez@email.com',
                'codigopostal' => 1406,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'EXENTO',
            ],
            [
                'razonsocial' => 'Martínez, Juan Pablo',
                'documentounico' => 20221062583,
                'direccion' => 'Av. Cabildo 3456',
                'telefono' => '011-5432-1098',
                'email' => 'juan.martinez@email.com',
                'codigopostal' => 1428,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'RESPONSABLE INSCRIPTO',
            ],
            [
                'razonsocial' => 'Fernández, Laura Beatriz',
                'documentounico' => 20200083394,
                'direccion' => 'Av. del Libertador 7890',
                'telefono' => '011-9876-5432',
                'email' => 'laura.fernandez@email.com',
                'codigopostal' => 1636,
                'localidad' => 'Olivos',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'MONOTRIBUTO',
            ],
            [
                'razonsocial' => 'González, Roberto Daniel',
                'documentounico' => 20220707513,
                'direccion' => 'Av. Belgrano 2345',
                'telefono' => '011-3456-7890',
                'email' => 'roberto.gonzalez@email.com',
                'codigopostal' => 1092,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'RESPONSABLE INSCRIPTO',
            ],
            [
                'razonsocial' => 'Pérez, Claudia Mónica',
                'documentounico' => 20221124643,
                'direccion' => 'Av. Pueyrredón 4567',
                'telefono' => '011-6789-0123',
                'email' => 'claudia.perez@email.com',
                'codigopostal' => 1118,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'MONOTRIBUTO',
            ],
            [
                'razonsocial' => 'Silva, Eduardo Raúl',
                'documentounico' => 20221064233,
                'direccion' => 'Av. Callao 6789',
                'telefono' => '011-7890-1234',
                'email' => 'eduardo.silva@email.com',
                'codigopostal' => 1023,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'EXENTO',
            ],
            [
                'razonsocial' => 'Torres, Patricia Susana',
                'documentounico' => 20201731594,
                'direccion' => 'Av. 9 de Julio 8901',
                'telefono' => '011-8901-2345',
                'email' => 'patricia.torres@email.com',
                'codigopostal' => 1047,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'RESPONSABLE INSCRIPTO',
            ],
            [
                'razonsocial' => 'Morales, Sergio Alejandro',
                'documentounico' => 20201797064,
                'direccion' => 'Av. Las Heras 0123',
                'telefono' => '011-9012-3456',
                'email' => 'sergio.morales@email.com',
                'codigopostal' => 1127,
                'localidad' => 'CABA',
                'provincia' => 'Buenos Aires',
                'condicioniva' => 'MONOTRIBUTO',
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
