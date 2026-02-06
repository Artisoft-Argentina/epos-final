<?php

namespace Database\Seeders;

use App\Models\Articulo;
use Illuminate\Database\Seeder;

class ArticulosTableSeeder extends Seeder
{
    public function run()
    {
        // Proveedores:
        // 1 - Distribuidora Juguetes SA (general)
        // 2 - Importadora Toys SRL (Mattel: Barbie, Hot Wheels, Fisher-Price)
        // 3 - Mayorista Didácticos (didácticos, arte)
        // 4 - Proveedor Peluches Norte (peluches)
        // 5 - Distribuidora LEGO Argentina (LEGO)

        $articulos = [
            [
                'codarticulo' => 'LEGO001',
                'articulo' => 'LEGO Classic',
                'descripcion' => 'Set de construcción con 484 piezas para crear infinitas posibilidades',
                'medida' => 'Caja',
                'precio' => 15999.99,
                'alicuota' => 21.00,
                'stockminimo' => 5,
                'categoria_id' => 5, // Construcción
                'marca_id' => 3, // LEGO
                'codprov' => 'LEG484',
                'supplier_id' => 5, // Distribuidora LEGO Argentina
            ],
            [
                'codarticulo' => 'BAR001',
                'articulo' => 'Barbie Fashionista',
                'descripcion' => 'Muñeca Barbie con vestido de moda y accesorios',
                'medida' => 'Unidad',
                'precio' => 8999.99,
                'alicuota' => 21.00,
                'stockminimo' => 10,
                'categoria_id' => 3, // Muñecas
                'marca_id' => 5, // Barbie
                'codprov' => 'BAR123',
                'supplier_id' => 2, // Importadora Toys SRL (Mattel)
            ],
            [
                'codarticulo' => 'HW001',
                'articulo' => 'Hot Wheels Pack 5 Autos',
                'descripcion' => 'Set de 5 autos de colección Hot Wheels escala 1:64',
                'medida' => 'Pack',
                'precio' => 4999.99,
                'alicuota' => 21.00,
                'stockminimo' => 15,
                'categoria_id' => 4, // Autos y Vehículos
                'marca_id' => 6, // Hot Wheels
                'codprov' => 'HW5PK',
                'supplier_id' => 2, // Importadora Toys SRL (Mattel)
            ],
            [
                'codarticulo' => 'PEL001',
                'articulo' => 'Peluche Oso Teddy',
                'descripcion' => 'Peluche de oso teddy suave y abrazable de 50cm',
                'medida' => '50cm',
                'precio' => 12999.99,
                'alicuota' => 21.00,
                'stockminimo' => 8,
                'categoria_id' => 2, // Peluches
                'marca_id' => 8, // Melissa & Doug
                'codprov' => 'TED50',
                'supplier_id' => 4, // Proveedor Peluches Norte
            ],
            [
                'codarticulo' => 'DID001',
                'articulo' => 'Rompecabezas Números y Letras',
                'descripcion' => 'Puzzle educativo de madera con números y letras del abecedario',
                'medida' => '30x40cm',
                'precio' => 6999.99,
                'alicuota' => 21.00,
                'stockminimo' => 12,
                'categoria_id' => 1, // Didácticos
                'marca_id' => 8, // Melissa & Doug
                'codprov' => 'EDU123',
                'supplier_id' => 3, // Mayorista Didácticos
            ],
            [
                'codarticulo' => 'PLAY001',
                'articulo' => 'Play-Doh Set Cocina',
                'descripcion' => 'Set de plastilina con moldes y herramientas para crear comidas',
                'medida' => 'Set',
                'precio' => 7999.99,
                'alicuota' => 21.00,
                'stockminimo' => 10,
                'categoria_id' => 9, // Arte y Manualidades
                'marca_id' => 12, // Play-Doh
                'codprov' => 'PD456',
                'supplier_id' => 3, // Mayorista Didácticos
            ],
            [
                'codarticulo' => 'NERF001',
                'articulo' => 'Nerf Elite',
                'descripcion' => 'Lanzador Nerf con tambor rotativo para 6 dardos',
                'medida' => 'Unidad',
                'precio' => 18999.99,
                'alicuota' => 21.00,
                'stockminimo' => 6,
                'categoria_id' => 7, // Deportes
                'marca_id' => 13, // Nerf
                'codprov' => 'NRF789',
                'supplier_id' => 1, // Distribuidora Juguetes SA
            ],
            [
                'codarticulo' => 'FP001',
                'articulo' => 'Fisher-Price Teléfono',
                'descripcion' => 'Teléfono de juguete con sonidos y ruedas para arrastrar',
                'medida' => 'Unidad',
                'precio' => 5999.99,
                'alicuota' => 21.00,
                'stockminimo' => 15,
                'categoria_id' => 10, // Bebés
                'marca_id' => 4, // Fisher-Price
                'codprov' => 'FP321',
                'supplier_id' => 2, // Importadora Toys SRL (Mattel)
            ],
        ];

        foreach ($articulos as $articulo) {
            Articulo::create($articulo);
        }
    }
}
