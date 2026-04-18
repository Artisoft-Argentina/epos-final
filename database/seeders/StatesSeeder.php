<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\State;
use Illuminate\Database\Seeder;

class StatesSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['name' => 'Ciudad Autónoma de Buenos Aires', 'afip_id' => 0, 'cities' => [
                'Agronomía', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano', 'Boedo', 'Caballito',
                'Chacarita', 'Coghlan', 'Colegiales', 'Constitución', 'Flores', 'Floresta', 'La Boca',
                'La Paternal', 'Liniers', 'Mataderos', 'Monte Castro', 'Montserrat', 'Nueva Pompeya',
                'Núñez', 'Palermo', 'Parque Avellaneda', 'Parque Chacabuco', 'Parque Chas',
                'Parque Patricios', 'Puerto Madero', 'Recoleta', 'Retiro', 'Saavedra', 'San Cristóbal',
                'San Nicolás', 'San Telmo', 'Versalles', 'Villa Crespo', 'Villa del Parque',
                'Villa Devoto', 'Villa General Mitre', 'Villa Lugano', 'Villa Luro', 'Villa Ortúzar',
                'Villa Pueyrredón', 'Villa Real', 'Villa Riachuelo', 'Villa Santa Rita', 'Villa Soldati',
                'Villa Urquiza', 'Vélez Sársfield',
            ]],
            ['name' => 'Buenos Aires', 'afip_id' => 1, 'cities' => [
                'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Quilmes', 'Lanús', 'Lomas de Zamora',
                'Almirante Brown', 'Merlo', 'Moreno', 'Tigre', 'General San Martín', 'Tres de Febrero',
                'Morón', 'Florencio Varela', 'Berazategui', 'Avellaneda', 'San Isidro', 'San Miguel',
                'José C. Paz', 'Malvinas Argentinas', 'Hurlingham', 'Ituzaingó', 'Esteban Echeverría',
                'Ezeiza', 'Pilar', 'San Fernando', 'San Vicente', 'Tandil', 'Olavarría', 'Pergamino',
                'Junín', 'Zárate', 'Campana', 'Necochea', 'Azul', 'Luján', 'Chivilcoy',
                'San Nicolás de los Arroyos', 'Coronel Suárez', 'Tres Arroyos', 'Benito Juárez',
                'Pehuajó', 'Bolívar', 'Dolores', 'Chascomús', 'Lobos', 'Navarro', 'Mercedes', 'Bragado',
            ]],
            ['name' => 'Catamarca', 'afip_id' => 2, 'cities' => [
                'San Fernando del Valle de Catamarca', 'San Isidro', 'Valle Viejo', 'Fray Mamerto Esquiú',
                'Tinogasta', 'Santa María', 'Andalgalá', 'Belén', 'Recreo', 'Huillapima', 'Aconquija',
                'Pomán', 'Paclín', 'Fiambalá', 'Londres', 'Antofagasta de la Sierra',
            ]],
            ['name' => 'Córdoba', 'afip_id' => 3, 'cities' => [
                'Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'San Francisco', 'Villa María', 'Cosquín',
                'Alta Gracia', 'Jesús María', 'Bell Ville', 'Laboulaye', 'Marcos Juárez', 'La Falda',
                'Mina Clavero', 'Villa General Belgrano', 'Río Tercero', 'Río Segundo', 'Oncativo',
                'Las Varillas', 'Leones', 'Morrison', 'Cruz Alta', 'Arroyito', 'Morteros',
                'Villa del Totoral', 'Oliva', 'General Cabrera', 'Deán Funes', 'Cruz del Eje',
                'Villa de Soto', 'Capilla del Monte',
            ]],
            ['name' => 'Corrientes', 'afip_id' => 4, 'cities' => [
                'Corrientes', 'Goya', 'Esquina', 'Mercedes', 'Curuzú Cuatiá', 'Monte Caseros',
                'Paso de los Libres', 'Santo Tomé', 'Ituzaingó', 'Bella Vista', 'Saladas', 'Mburucuyá',
                'Yapeyú', 'San Luis del Palmar', 'Alvear', 'Sauce', 'Lavalle',
            ]],
            ['name' => 'Entre Ríos', 'afip_id' => 5, 'cities' => [
                'Paraná', 'Concordia', 'Gualeguaychú', 'Concepción del Uruguay', 'Gualeguay', 'Colón',
                'Victoria', 'Nogoyá', 'La Paz', 'Villaguay', 'San Salvador', 'Crespo', 'Diamante',
                'Chajarí', 'Federal', 'Federación', 'Rosario del Tala', 'Basavilbaso', 'Urdinarrain',
            ]],
            ['name' => 'Jujuy', 'afip_id' => 6, 'cities' => [
                'San Salvador de Jujuy', 'Palpalá', 'San Pedro de Jujuy', 'Libertador General San Martín',
                'Humahuaca', 'Tilcara', 'La Quiaca', 'Perico', 'El Carmen', 'Monterrico',
                'Fraile Pintado', 'Caimancito', 'Abra Pampa', 'Huacalera',
            ]],
            ['name' => 'Mendoza', 'afip_id' => 7, 'cities' => [
                'Mendoza', 'San Rafael', 'Godoy Cruz', 'Guaymallén', 'Las Heras', 'Maipú',
                'Luján de Cuyo', 'Rivadavia', 'Junín', 'General Alvear', 'Malargüe', 'San Martín',
                'La Paz', 'Santa Rosa', 'Tunuyán', 'Tupungato', 'San Carlos', 'Lavalle',
            ]],
            ['name' => 'La Rioja', 'afip_id' => 8, 'cities' => [
                'La Rioja', 'Chilecito', 'Aimogasta', 'Chamical', 'Chepes', 'Villa Unión',
                'Patquía', 'Vinchina', 'Nonogasta', 'Famatina', 'Castro Barros', 'Arauco',
            ]],
            ['name' => 'Salta', 'afip_id' => 9, 'cities' => [
                'Salta', 'San Ramón de la Nueva Orán', 'Tartagal', 'Metán', 'Rosario de la Frontera',
                'Cafayate', 'Güemes', 'General Güemes', 'Embarcación', 'Joaquín V. González',
                'Rivadavia', 'Pichanal', 'Las Lajitas', 'Aguaray', 'Salvador Mazza', 'Cachi',
            ]],
            ['name' => 'San Juan', 'afip_id' => 10, 'cities' => [
                'San Juan', 'Rivadavia', 'Rawson', 'Chimbas', 'Santa Lucía', 'Pocito', 'Caucete',
                'San Martín', '9 de Julio', 'Ullum', 'Zonda', 'Calingasta', 'Iglesia', 'Jáchal',
                'Valle Fértil',
            ]],
            ['name' => 'San Luis', 'afip_id' => 11, 'cities' => [
                'San Luis', 'Villa Mercedes', 'Merlo', 'Justo Daract', 'Santa Rosa del Conlara',
                'Quines', 'Potrero de los Funes', 'La Toma', 'Tilisarao',
                'San Francisco del Monte de Oro', 'Naschel', 'Buena Esperanza', 'Arizona',
            ]],
            ['name' => 'Santa Fe', 'afip_id' => 12, 'cities' => [
                'Santa Fe', 'Rosario', 'Rafaela', 'Venado Tuerto', 'Santo Tomé',
                'Villa Gobernador Gálvez', 'Reconquista', 'San Lorenzo', 'Casilda', 'Esperanza',
                'San Jorge', 'Cañada de Gómez', 'Firmat', 'Rufino', 'Las Rosas', 'Gálvez', 'Tostado',
                'Malabrigo', 'Avellaneda', 'Sunchales', 'Vera', 'Villa Constitución', 'Carcarañá',
            ]],
            ['name' => 'Santiago del Estero', 'afip_id' => 13, 'cities' => [
                'Santiago del Estero', 'La Banda', 'Termas de Río Hondo', 'Frías', 'Añatuya',
                'Loreto', 'Fernández', 'Ojo de Agua', 'Quimilí', 'Monte Quemado', 'Clodomira',
                'Villa Atamisqui', 'Pinto', 'Suncho Corral',
            ]],
            ['name' => 'Tucumán', 'afip_id' => 14, 'cities' => [
                'San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Concepción',
                'Banda del Río Salí', 'Aguilares', 'Alderetes', 'Lules', 'Monteros', 'Famaillá',
                'Simoca', 'Bella Vista', 'Trancas', 'Amaicha del Valle', 'Tafí del Valle',
                'El Cadillal', 'Juan Bautista Alberdi',
            ]],
            ['name' => 'Chaco', 'afip_id' => 16, 'cities' => [
                'Resistencia', 'Barranqueras', 'Fontana', 'Puerto Vilelas', 'Margarita Belén',
                'Presidencia Roque Sáenz Peña', 'Villa Ángela', 'Charata', 'Quitilipi',
                'General José de San Martín', 'Las Breñas', 'Juan José Castelli', 'Machagai',
                'Napenay', 'Pampa del Infierno', 'Corzuela', 'Gancedo', 'Concepción del Bermejo',
                'Miraflores', 'Hermoso Campo', 'Villa Río Bermejito',
            ]],
            ['name' => 'Chubut', 'afip_id' => 17, 'cities' => [
                'Rawson', 'Comodoro Rivadavia', 'Trelew', 'Puerto Madryn', 'Esquel', 'Sarmiento',
                'Gaiman', 'Rada Tilly', 'Río Mayo', 'Gobernador Costa', 'Tecka', 'Paso de Indios',
                'El Maitén', 'Cholila', 'Lago Puelo', 'El Hoyo',
            ]],
            ['name' => 'Formosa', 'afip_id' => 18, 'cities' => [
                'Formosa', 'Clorinda', 'Pirané', 'General Lucio Victorio Mansilla',
                'Ingeniero Juárez', 'El Colorado', 'Las Lomitas', 'Ibarreta',
                'Comandante Fontana', 'Laguna Blanca', 'General Belgrano',
            ]],
            ['name' => 'Misiones', 'afip_id' => 19, 'cities' => [
                'Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú', 'Apóstoles', 'San Vicente',
                'Jardín América', 'Leandro N. Alem', 'Aristóbulo del Valle', 'Campo Grande',
                'Bernardo de Irigoyen', 'San Antonio', 'Garuhapé', 'Dos de Mayo', 'Wanda',
                'Montecarlo', 'Puerto Esperanza',
            ]],
            ['name' => 'Neuquén', 'afip_id' => 20, 'cities' => [
                'Neuquén', 'Plottier', 'Cipolletti', 'Centenario', 'San Martín de los Andes',
                'Junín de los Andes', 'Villa La Angostura', 'Rincón de los Sauces', 'Zapala',
                'Cutral-Có', 'Plaza Huincul', 'Añelo', 'Aluminé', 'Las Lajas', 'Loncopué',
                'Piedra del Águila',
            ]],
            ['name' => 'La Pampa', 'afip_id' => 21, 'cities' => [
                'Santa Rosa', 'General Pico', 'Toay', 'Eduardo Castex', 'Victorica', 'Realicó',
                'Macachín', 'General Acha', 'Intendente Alvear', 'Catriló', 'Rancul', 'Lonquimay',
                'Quemú Quemú', 'Bernasconi',
            ]],
            ['name' => 'Río Negro', 'afip_id' => 22, 'cities' => [
                'Viedma', 'San Carlos de Bariloche', 'General Roca', 'Cipolletti', 'Allen',
                'Villa Regina', 'Catriel', 'El Bolsón', 'Jacobacci', 'Río Colorado', 'Luis Beltrán',
                'Lamarque', 'Cervantes', 'Ingeniero Jacobacci', 'Sierra Grande', 'San Antonio Oeste',
            ]],
            ['name' => 'Santa Cruz', 'afip_id' => 23, 'cities' => [
                'Río Gallegos', 'Caleta Olivia', 'Pico Truncado', 'Las Heras', 'Puerto San Julián',
                'Gobernador Gregores', 'El Calafate', 'El Chaltén', 'Perito Moreno', 'Los Antiguos',
                'Puerto Deseado', 'Comandante Luis Piedra Buena',
            ]],
            ['name' => 'Tierra del Fuego', 'afip_id' => 24, 'cities' => [
                'Ushuaia', 'Río Grande', 'Tolhuin',
            ]],
        ];

        foreach ($data as $stateData) {
            $state = State::create([
                'name'    => $stateData['name'],
                'afip_id' => $stateData['afip_id'],
            ]);

            City::insert(array_map(fn($name) => [
                'name'       => $name,
                'state_id'   => $state->id,
                'created_at' => now(),
                'updated_at' => now(),
            ], $stateData['cities']));
        }
    }
}
