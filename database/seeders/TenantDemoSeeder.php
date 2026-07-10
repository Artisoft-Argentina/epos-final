<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Services\MovimientoService;
use App\Services\PriceService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TenantDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $brands     = $this->seedBrands();
            $categories = $this->seedCategories();
            $suppliers  = $this->seedSuppliers();
            $this->seedPriceLists();
            $products   = $this->seedProducts($brands, $categories, $suppliers);
            $this->seedProductPrices($products);
            $this->seedInitialStock($products);
            $this->seedCustomers();
        });

        $this->command->info('✓ Demo data sembrada en este tenant.');
    }

    private function seedBrands(): array
    {
        $names = ['Genérica', 'Philips', 'Samsung', 'Sony', 'LG', 'Stanley', 'Bosch'];
        return collect($names)->map(fn ($n) => Brand::firstOrCreate(['name' => $n], ['active' => true]))->all();
    }

    private function seedCategories(): array
    {
        $names = ['Electrónica', 'Herramientas', 'Hogar', 'Iluminación', 'Limpieza', 'Oficina'];
        return collect($names)->map(fn ($n) => Category::firstOrCreate(['name' => $n], ['active' => true]))->all();
    }

    private function seedSuppliers(): array
    {
        $data = [
            ['business_name' => 'Importadora del Sur SRL', 'tax_id' => '30712345678', 'address' => 'Av. Belgrano 1234, CABA',  'phone' => '11-4555-1010', 'email' => 'ventas@isur.com.ar'],
            ['business_name' => 'Mayorista Norte SA',      'tax_id' => '30715556677', 'address' => 'San Martín 567, Córdoba',  'phone' => '11-4666-2020', 'email' => 'pedidos@mnorte.com.ar'],
            ['business_name' => 'Distribuidora Centro',    'tax_id' => '30717778899', 'address' => 'Mitre 890, Rosario',       'phone' => '11-4777-3030', 'email' => 'info@dcentro.com.ar'],
        ];
        return collect($data)->map(fn ($d) => Supplier::firstOrCreate(['tax_id' => $d['tax_id']], $d + ['active' => true]))->all();
    }

    private function seedPriceLists(): void
    {
        if (! PriceList::where('default_pos', true)->exists()) {
            PriceList::create(['name' => 'Lista POS', 'percentage' => 0, 'pricing_strategy' => 'list', 'default_pos' => true, 'default_ecommerce' => false, 'active' => true]);
        }
        if (! PriceList::where('default_ecommerce', true)->exists()) {
            PriceList::create(['name' => 'Lista Web', 'percentage' => 10, 'pricing_strategy' => 'list', 'default_pos' => false, 'default_ecommerce' => true, 'active' => true]);
        }
        PriceList::firstOrCreate(['name' => 'Mayorista'], ['percentage' => -15, 'pricing_strategy' => 'product', 'default_pos' => false, 'default_ecommerce' => false, 'active' => true]);
    }

    private function seedProductPrices(array $products): void
    {
        $priceService = app(PriceService::class);

        foreach ($products as $product) {
            if ($product->priceLists()->count() === 0) {
                $priceService->generateForProduct($product);
            }
        }
    }

    private function seedProducts(array $brands, array $categories, array $suppliers): array
    {
        $catalog = [
            ['Lámpara LED 9W',          'LED-9W',   850,  'Iluminación', 'Philips'],
            ['Lámpara LED 12W',         'LED-12W',  1200, 'Iluminación', 'Philips'],
            ['Foco Halógeno 60W',       'HAL-60',   450,  'Iluminación', 'Genérica'],
            ['Tira LED 5m RGB',         'TIRA-5M',  4500, 'Iluminación', 'LG'],
            ['Taladro 750W',            'TAL-750',  35000,'Herramientas','Bosch'],
            ['Sierra Caladora 600W',    'CAL-600',  42000,'Herramientas','Bosch'],
            ['Destornillador Eléctrico','DEST-EL',  18500,'Herramientas','Stanley'],
            ['Set Llaves 12 piezas',    'LLA-12',   12500,'Herramientas','Stanley'],
            ['TV LED 32"',              'TV-32',    280000,'Electrónica','Samsung'],
            ['TV LED 50"',              'TV-50',    520000,'Electrónica','LG'],
            ['Auriculares Bluetooth',   'AUR-BT',   28000, 'Electrónica','Sony'],
            ['Parlante Portátil',       'PARL-PT',  45000, 'Electrónica','Sony'],
            ['Cafetera Express',        'CAF-EXP',  95000, 'Hogar',      'Philips'],
            ['Pava Eléctrica 1.7L',     'PAVA-17',  22000, 'Hogar',      'Philips'],
            ['Aspiradora 1400W',        'ASP-14',   78000, 'Hogar',      'LG'],
            ['Lavandina 1L',            'LAV-1L',   650,   'Limpieza',   'Genérica'],
            ['Detergente 750ml',        'DET-750',  890,   'Limpieza',   'Genérica'],
            ['Trapo de Piso',           'TRAP-01',  450,   'Limpieza',   'Genérica'],
            ['Resma A4 500h',           'RES-A4',   8500,  'Oficina',    'Genérica'],
            ['Caja de Birolapices x12', 'BIR-12',   3200,  'Oficina',    'Genérica'],
        ];

        $brandsByName     = collect($brands)->keyBy('name');
        $categoriesByName = collect($categories)->keyBy('name');
        $defaultSupplier  = $suppliers[0];

        return collect($catalog)->map(function ($row, $idx) use ($brandsByName, $categoriesByName, $defaultSupplier) {
            [$name, $sku, $cost, $catName, $brandName] = $row;
            return Product::firstOrCreate(
                ['sku' => $sku],
                [
                    'name'          => $name,
                    'description'   => $name . ' - producto demo',
                    'unit'          => 'UN',
                    'cost'          => $cost,
                    'tax_rate'      => 21,
                    'min_stock'     => 5,
                    'brand_id'      => $brandsByName[$brandName]->id,
                    'category_id'   => $categoriesByName[$catName]->id,
                    'supplier_id'   => $defaultSupplier->id,
                    'supplier_code' => 'SUP-' . str_pad((string) ($idx + 1), 4, '0', STR_PAD_LEFT),
                    'barcode'       => '779' . str_pad((string) (1000000 + $idx), 10, '0', STR_PAD_LEFT),
                    'active'        => true,
                ]
            );
        })->all();
    }

    private function seedInitialStock(array $products): void
    {
        $warehouse = Warehouse::isDefault()->first();
        if (! $warehouse) return;

        $service = app(MovimientoService::class);
        foreach ($products as $product) {
            $stock = Stock::forProductInWarehouse($product->id, $warehouse->id);
            if ($stock->movements()->where('type', StockMovement::TYPE_ADJUSTMENT_ENTRY)->exists()) {
                continue;
            }
            $service->registrar(
                $stock,
                StockMovement::TYPE_ADJUSTMENT_ENTRY,
                rand(20, 100),
                null, null,
                'Stock inicial demo'
            );
        }
    }

    private function seedCustomers(): void
    {
        // Personas físicas: usan dni; jurídicas: usan tax_id (CUIT).
        $fisicas = [
            ['business_name' => 'Juan Pérez',       'dni' => '12345678', 'tax_status' => 'CF', 'phone' => '11-3000-0001', 'email' => 'juan.perez@mail.com'],
            ['business_name' => 'María González',   'dni' => '23456789', 'tax_status' => 'CF', 'phone' => '11-3000-0002', 'email' => 'maria.gonzalez@mail.com'],
            ['business_name' => 'Carlos Rodríguez', 'dni' => '34567890', 'tax_status' => 'CF', 'phone' => '11-3000-0003', 'email' => 'carlos.r@mail.com'],
            ['business_name' => 'Lucía Fernández',  'dni' => '45678901', 'tax_status' => 'MO', 'phone' => '11-3000-0004', 'email' => 'lucia.f@mail.com'],
            ['business_name' => 'Diego Martínez',   'dni' => '56789012', 'tax_status' => 'CF', 'phone' => '11-3000-0005', 'email' => 'diego.m@mail.com'],
            ['business_name' => 'Kiosco La Esquina','dni' => '67890123', 'tax_status' => 'MO', 'phone' => '11-4000-0004', 'email' => 'kioscoesquina@mail.com'],
            ['business_name' => 'Almacén Don José', 'dni' => '78901234', 'tax_status' => 'MO', 'phone' => '11-4000-0005', 'email' => 'donjose@mail.com'],
        ];

        $juridicas = [
            ['business_name' => 'Ferretería El Tornillo SRL', 'tax_id' => '30678901236', 'tax_status' => 'RI', 'phone' => '11-4000-0001', 'email' => 'ventas@eltornillo.com'],
            ['business_name' => 'Comercial San Martín SA',    'tax_id' => '30789012347', 'tax_status' => 'RI', 'phone' => '11-4000-0002', 'email' => 'compras@sanmartin.com'],
            ['business_name' => 'Distribuidora Norte',        'tax_id' => '30890123458', 'tax_status' => 'RI', 'phone' => '11-4000-0003', 'email' => 'pedidos@dnorte.com'],
        ];

        foreach ($fisicas as $row) {
            Customer::firstOrCreate(
                ['dni' => $row['dni']],
                $row + ['person_type' => 'fisica', 'active' => true, 'credit' => 0]
            );
        }

        foreach ($juridicas as $row) {
            Customer::firstOrCreate(
                ['tax_id' => $row['tax_id']],
                $row + ['person_type' => 'juridica', 'active' => true, 'credit' => 0]
            );
        }
    }
}
