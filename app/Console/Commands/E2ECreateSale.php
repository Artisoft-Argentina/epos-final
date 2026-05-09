<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\Delivery;
use App\Models\PointOfSale;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Services\InvoiceNumberService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Helper de pruebas E2E: crea una venta directamente vía Eloquent.
 * Saltea AFIP, ajustes de stock y pagos — solo arma la venta y entregas pendientes.
 *
 * Uso (correr siempre dentro del tenant e2e):
 *   php artisan tenants:run e2e:create-sale --tenants=e2e \
 *       -- --customer-tax-id=30000000007 --product-sku=PROD-12345 --quantity=2
 *
 * Imprime en stdout el ID de la venta creada para pipelining.
 */
class E2ECreateSale extends Command
{
    protected $signature = 'e2e:create-sale
                            {--customer-tax-id= : CUIT del cliente (default: primer customer)}
                            {--customer-dni= : DNI del cliente (alternativa)}
                            {--product-sku= : SKU del producto (default: primer product)}
                            {--quantity=1 : Cantidad (default 1)}
                            {--auto-delivery=1 : Crear deliveries pendientes (1/0, default 1)}';

    protected $description = '[E2E] Crea una venta mínima vía Eloquent para usar en specs.';

    public function handle(InvoiceNumberService $invoiceService): int
    {
        $customer = $this->option('customer-tax-id')
            ? Customer::where('tax_id', $this->option('customer-tax-id'))->firstOrFail()
            : ($this->option('customer-dni')
                ? Customer::where('dni', $this->option('customer-dni'))->firstOrFail()
                : Customer::orderBy('id')->firstOrFail());

        $product = $this->option('product-sku')
            ? Product::where('sku', $this->option('product-sku'))->firstOrFail()
            : Product::orderBy('id')->firstOrFail();

        $quantity = (int) $this->option('quantity');
        $price = (float) $product->price;
        $subtotal = $price * $quantity;

        $pos = PointOfSale::where('is_default', true)->firstOrFail();
        $warehouse = Warehouse::where('is_default', true)->firstOrFail();
        $priceList = PriceList::where('default_pos', true)->first();
        $letter = $pos->voucher_letter_default ?? 'B';

        $saleId = DB::transaction(function () use ($customer, $product, $quantity, $price, $subtotal, $pos, $warehouse, $priceList, $letter, $invoiceService) {
            $invoiceNumber = $invoiceService->next($pos, $letter);

            $sale = Sale::create([
                'pos_number'          => $pos->pos_number,
                'voucher_letter'      => $letter,
                'invoice_number'      => $invoiceNumber,
                'tax_id'              => $customer->tax_id ?? $customer->dni ?? '0',
                'date'                => now()->format('Y-m-d'),
                'discount'            => 0,
                'surcharge'           => 0,
                'additional_discount' => 0,
                'subtotal'            => $subtotal,
                'total'               => $subtotal,
                'payment_status'      => 'NO',
                'sale_condition'      => 'CONTADO',
                'sale_type'           => 'pos',
                'customer_id'         => $customer->id,
                'price_list_id'       => $priceList?->id,
                'point_of_sale_id'    => $pos->id,
                'warehouse_id'        => $warehouse->id,
            ]);

            $sale->products()->attach($product->id, [
                'supplier_code' => $product->supplier_code,
                'sku'           => $product->sku,
                'name'          => $product->name,
                'unit'          => $product->unit,
                'quantity'      => $quantity,
                'discount'      => 0,
                'tax_rate'      => $product->tax_rate,
                'unit_price'    => $price,
                'subtotal'      => $subtotal,
            ]);

            if ((bool) $this->option('auto-delivery')) {
                Delivery::create([
                    'sale_id'       => $sale->id,
                    'product_id'    => $product->id,
                    'quantity'      => $quantity,
                    'delivery_date' => now()->format('Y-m-d'),
                    'status'        => 'pending',
                    'warehouse_id'  => $warehouse->id,
                    'active'        => true,
                ]);
            }

            return $sale->id;
        });

        $this->line((string) $saleId);

        return self::SUCCESS;
    }
}
