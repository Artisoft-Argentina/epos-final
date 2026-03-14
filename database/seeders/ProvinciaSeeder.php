<?php

namespace Database\Seeders;

use App\Models\Localidad;
use App\Models\Provincia;
use Illuminate\Database\Seeder;

class ProvinciaSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'nombre'  => 'Ciudad Autónoma de Buenos Aires',
                'id_afip' => 0,
                'localidades' => [
                    'Agronomía', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano',
                    'Boedo', 'Caballito', 'Chacarita', 'Coghlan', 'Colegiales',
                    'Constitución', 'Flores', 'Floresta', 'La Boca', 'La Paternal',
                    'Liniers', 'Mataderos', 'Monte Castro', 'Montserrat', 'Nueva Pompeya',
                    'Núñez', 'Palermo', 'Parque Avellaneda', 'Parque Chacabuco',
                    'Parque Chas', 'Parque Patricios', 'Puerto Madero', 'Recoleta',
                    'Retiro', 'Saavedra', 'San Cristóbal', 'San Nicolás', 'San Telmo',
                    'Versalles', 'Villa Crespo', 'Villa del Parque', 'Villa Devoto',
                    'Villa General Mitre', 'Villa Lugano', 'Villa Luro', 'Villa Ortúzar',
                    'Villa Pueyrredón', 'Villa Real', 'Villa Riachuelo', 'Villa Santa Rita',
                    'Villa Soldati', 'Villa Urquiza', 'Vélez Sársfield',
                ],
            ],
            [
                'nombre'  => 'Buenos Aires',
                'id_afip' => 1,
                'localidades' => [
                    'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Quilmes', 'Lanús',
                    'Lomas de Zamora', 'Almirante Brown', 'Merlo', 'Moreno', 'Tigre',
                    'General San Martín', 'Tres de Febrero', 'Morón', 'Florencio Varela',
                    'Berazategui', 'Avellaneda', 'San Isidro', 'San Miguel', 'José C. Paz',
                    'Malvinas Argentinas', 'Hurlingham', 'Ituzaingó', 'Esteban Echeverría',
                    'Ezeiza', 'Pilar', 'San Fernando', 'San Vicente', 'Tandil',
                    'Olavarría', 'Pergamino', 'Junín', 'Zárate', 'Campana',
                    'Necochea', 'Azul', 'Luján', 'Chivilcoy', 'San Nicolás de los Arroyos',
                    'Coronel Suárez', 'Tres Arroyos', 'Benito Juárez', 'Pehuajó',
                    'Bolívar', 'General Pico (transferida)', 'Dolores', 'Chascomús',
                    'Lobos', 'Navarro', 'Mercedes', 'Bragado',
                ],
            ],
            [
                'nombre'  => 'Catamarca',
                'id_afip' => 2,
                'localidades' => [
                    'San Fernando del Valle de Catamarca', 'San Isidro', 'Valle Viejo',
                    'Fray Mamerto Esquiú', 'Tinogasta', 'Santa María', 'Andalgalá',
                    'Belén', 'Recreo', 'Huillapima', 'Aconquija', 'Pomán',
                    'Paclín', 'Fiambalá', 'Londres', 'Antofagasta de la Sierra',
                ],
            ],
            [
                'nombre'  => 'Córdoba',
                'id_afip' => 3,
                'localidades' => [
                    'Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'San Francisco',
                    'Villa María', 'Cosquín', 'Alta Gracia', 'Jesús María', 'Bell Ville',
                    'Laboulaye', 'Marcos Juárez', 'La Falda', 'Mina Clavero',
                    'Villa General Belgrano', 'Río Tercero', 'Río Segundo', 'Oncativo',
                    'Las Varillas', 'Leones', 'Morrison', 'Cruz Alta', 'Arroyito',
                    'Morteros', 'Villa del Totoral', 'Oliva', 'General Cabrera',
                    'Deán Funes', 'Cruz del Eje', 'Villa de Soto', 'Capilla del Monte',
                ],
            ],
            [
                'nombre'  => 'Corrientes',
                'id_afip' => 4,
                'localidades' => [
                    'Corrientes', 'Goya', 'Posadas (limítrofe)', 'Esquina', 'Mercedes',
                    'Curuzú Cuatiá', 'Monte Caseros', 'Paso de los Libres', 'Santo Tomé',
                    'Ituzaingó', 'Bella Vista', 'Saladas', 'Mburucuyá', 'Yapeyú',
                    'San Luis del Palmar', 'Alvear', 'Sauce', 'Lavalle',
                ],
            ],
            [
                'nombre'  => 'Entre Ríos',
                'id_afip' => 5,
                'localidades' => [
                    'Paraná', 'Concordia', 'Gualeguaychú', 'Concepción del Uruguay',
                    'Gualeguay', 'Colón', 'Victoria', 'Nogoyá', 'La Paz', 'Villaguay',
                    'San Salvador', 'Crespo', 'Diamante', 'Chajarí', 'Federal',
                    'Federación', 'Rosario del Tala', 'Basavilbaso', 'Urdinarrain',
                ],
            ],
            [
                'nombre'  => 'Jujuy',
                'id_afip' => 6,
                'localidades' => [
                    'San Salvador de Jujuy', 'Palpalá', 'San Pedro de Jujuy', 'Libertador General San Martín',
                    'Humahuaca', 'Tilcara', 'La Quiaca', 'Perico', 'El Carmen',
                    'Monterrico', 'Fraile Pintado', 'Caimancito', 'Abra Pampa', 'Huacalera',
                ],
            ],
            [
                'nombre'  => 'Mendoza',
                'id_afip' => 7,
                'localidades' => [
                    'Mendoza', 'San Rafael', 'Godoy Cruz', 'Guaymallén', 'Las Heras',
                    'Maipú', 'Luján de Cuyo', 'Rivadavia', 'Junín', 'General Alvear',
                    'Malargüe', 'San Martín', 'La Paz', 'Santa Rosa', 'Tunuyán',
                    'Tupungato', 'San Carlos', 'Lavalle', 'Lavalle (rural)',
                ],
            ],
            [
                'nombre'  => 'La Rioja',
                'id_afip' => 8,
                'localidades' => [
                    'La Rioja', 'Chilecito', 'Aimogasta', 'Chamical', 'Chepes',
                    'Villa Unión', 'Patquía', 'Vinchina', 'Nonogasta', 'Famatina',
                    'Castro Barros', 'Arauco',
                ],
            ],
            [
                'nombre'  => 'Salta',
                'id_afip' => 9,
                'localidades' => [
                    'Salta', 'San Ramón de la Nueva Orán', 'Tartagal', 'Metán',
                    'Rosario de la Frontera', 'Cafayate', 'Güemes', 'General Güemes',
                    'Embarcación', 'Joaquín V. González', 'Rivadavia', 'Pichanal',
                    'Las Lajitas', 'Aguaray', 'Salvador Mazza', 'Cachi',
                ],
            ],
            [
                'nombre'  => 'San Juan',
                'id_afip' => 10,
                'localidades' => [
                    'San Juan', 'Rivadavia', 'Rawson', 'Chimbas', 'Santa Lucía',
                    'Pocito', 'Caucete', 'San Martín', '9 de Julio', 'Ullum',
                    'Zonda', 'Calingasta', 'Iglesia', 'Jáchal', 'Valle Fértil',
                ],
            ],
            [
                'nombre'  => 'San Luis',
                'id_afip' => 11,
                'localidades' => [
                    'San Luis', 'Villa Mercedes', 'Merlo', 'Justo Daract', 'Santa Rosa del Conlara',
                    'Quines', 'Potrero de los Funes', 'La Toma', 'Tilisarao', 'San Francisco del Monte de Oro',
                    'Naschel', 'Buena Esperanza', 'Arizona',
                ],
            ],
            [
                'nombre'  => 'Santa Fe',
                'id_afip' => 12,
                'localidades' => [
                    'Santa Fe', 'Rosario', 'Rafaela', 'Venado Tuerto', 'Santo Tomé',
                    'Villa Gobernador Gálvez', 'Reconquista', 'San Lorenzo', 'Casilda',
                    'Esperanza', 'San Jorge', 'Cañada de Gómez', 'Firmat', 'Rufino',
                    'Las Rosas', 'Gálvez', 'Tostado', 'Malabrigo', 'Avellaneda',
                    'Sunchales', 'Vera', 'Villa Constitución', 'Carcarañá',
                ],
            ],
            [
                'nombre'  => 'Santiago del Estero',
                'id_afip' => 13,
                'localidades' => [
                    'Santiago del Estero', 'La Banda', 'Termas de Río Hondo', 'Frías',
                    'Añatuya', 'Loreto', 'Fernández', 'Ojo de Agua', 'Quimilí',
                    'Monte Quemado', 'Clodomira', 'Villa Atamisqui', 'Pinto', 'Suncho Corral',
                ],
            ],
            [
                'nombre'  => 'Tucumán',
                'id_afip' => 14,
                'localidades' => [
                    'San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Concepción',
                    'Banda del Río Salí', 'Aguilares', 'Alderetes', 'Lules', 'Monteros',
                    'Famaillá', 'Simoca', 'Bella Vista', 'Trancas', 'Amaicha del Valle',
                    'Tafí del Valle', 'El Cadillal', 'Juan Bautista Alberdi',
                ],
            ],
            [
                'nombre'  => 'Chaco',
                'id_afip' => 16,
                'localidades' => [
                    'Resistencia', 'Barranqueras', 'Fontana', 'Puerto Vilelas',
                    'Margarita Belén', 'Presidencia Roque Sáenz Peña', 'Villa Ángela',
                    'Charata', 'Quitilipi', 'General José de San Martín',
                    'Las Breñas', 'Juan José Castelli', 'Machagai', 'Napenay',
                    'Pampa del Infierno', 'Corzuela', 'Gancedo', 'Concepción del Bermejo',
                    'Miraflores', 'Hermoso Campo', 'Villa Río Bermejito',
                ],
            ],
            [
                'nombre'  => 'Chubut',
                'id_afip' => 17,
                'localidades' => [
                    'Rawson', 'Comodoro Rivadavia', 'Trelew', 'Puerto Madryn', 'Esquel',
                    'Sarmiento', 'Gaiman', 'Madryn', 'Rada Tilly', 'Caleta Olivia (limítrofe)',
                    'Río Mayo', 'Gobernador Costa', 'Tecka', 'Paso de Indios',
                    'El Maitén', 'Cholila', 'Lago Puelo', 'El Hoyo',
                ],
            ],
            [
                'nombre'  => 'Formosa',
                'id_afip' => 18,
                'localidades' => [
                    'Formosa', 'Clorinda', 'Pirané', 'General Lucio Victorio Mansilla',
                    'Ingeniero Juárez', 'El Colorado', 'Las Lomitas', 'Ibarreta',
                    'Comandante Fontana', 'Laguna Blanca', 'General Belgrano',
                ],
            ],
            [
                'nombre'  => 'Misiones',
                'id_afip' => 19,
                'localidades' => [
                    'Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú', 'Apóstoles',
                    'San Vicente', 'Jardín América', 'Leandro N. Alem', 'Aristóbulo del Valle',
                    'Campo Grande', 'El Dorado', 'Bernardo de Irigoyen', 'San Antonio',
                    'Garuhapé', 'Dos de Mayo', 'Wanda', 'Montecarlo', 'Puerto Esperanza',
                ],
            ],
            [
                'nombre'  => 'Neuquén',
                'id_afip' => 20,
                'localidades' => [
                    'Neuquén', 'Plottier', 'Cipolletti', 'Centenario', 'San Martín de los Andes',
                    'Junín de los Andes', 'Villa La Angostura', 'Rincón de los Sauces',
                    'Zapala', 'Cutral-Có', 'Plaza Huincul', 'Añelo', 'Aluminé',
                    'Las Lajas', 'Loncopué', 'Piedra del Águila',
                ],
            ],
            [
                'nombre'  => 'La Pampa',
                'id_afip' => 21,
                'localidades' => [
                    'Santa Rosa', 'General Pico', 'Toay', 'Eduardo Castex', 'Victorica',
                    'Realicó', 'Macachín', 'General Acha', 'Intendente Alvear',
                    'Catriló', 'Rancul', 'Lonquimay', 'Quemú Quemú', 'Bernasconi',
                ],
            ],
            [
                'nombre'  => 'Río Negro',
                'id_afip' => 22,
                'localidades' => [
                    'Viedma', 'San Carlos de Bariloche', 'General Roca', 'Cipolletti',
                    'Allen', 'Villa Regina', 'Catriel', 'El Bolsón', 'Jacobacci',
                    'Río Colorado', 'Luis Beltrán', 'Lamarque', 'Cervantes',
                    'Ingeniero Jacobacci', 'Sierra Grande', 'San Antonio Oeste',
                ],
            ],
            [
                'nombre'  => 'Santa Cruz',
                'id_afip' => 23,
                'localidades' => [
                    'Río Gallegos', 'Caleta Olivia', 'Pico Truncado', 'Las Heras',
                    'Puerto Madryn (limítrofe)', 'Puerto San Julián', 'Gobernador Gregores',
                    'El Calafate', 'El Chaltén', 'Perito Moreno', 'Los Antiguos',
                    'Puerto Deseado', 'Comandante Luis Piedra Buena',
                ],
            ],
            [
                'nombre'  => 'Tierra del Fuego',
                'id_afip' => 24,
                'localidades' => [
                    'Ushuaia', 'Río Grande', 'Tolhuin',
                ],
            ],
        ];

        foreach ($data as $provinciaData) {
            $provincia = Provincia::create([
                'nombre'  => $provinciaData['nombre'],
                'id_afip' => $provinciaData['id_afip'],
            ]);

            $localidades = array_map(fn($nombre) => [
                'nombre'      => $nombre,
                'provincia_id' => $provincia->id,
                'created_at'  => now(),
                'updated_at'  => now(),
            ], $provinciaData['localidades']);

            Localidad::insert($localidades);
        }
    }
}
