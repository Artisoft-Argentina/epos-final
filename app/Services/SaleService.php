<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\SaleCondition;
use App\Enums\SaleType;
use App\Models\Customer;
use App\Models\Delivery;
use App\Models\PointOfSale;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SaleService
{
    public function __construct(
        private readonly InvoiceNumberService $invoiceNumberService,
        private readonly DeliveryService $deliveryService,
    ) {}

    /**
     * Crea una venta completa (cabecera + ítems + entregas + pago inicial) de forma atómica.
     * Si algún ítem no tiene stock (entrega inmediata) se revierte toda la operación.
     */
    public function create(array $data, User $user): Sale
    {
        return DB::transaction(function () use ($data, $user) {
            $customer = Customer::findOrFail($data['customer_id']);
            $items    = $data['items'];

            // Precarga de productos con sus listas de precios (evita N+1).
            $productIds = collect($items)->pluck('product_id')->unique();
            $products   = Product::with('priceLists')->whereIn('id', $productIds)->get()->keyBy('id');

            $saleType = SaleType::from($data['sale_type'] ?? 'pos');

            $pos = $this->resolvePointOfSale($data, $user);
            if (! $pos) {
                throw new RuntimeException('No hay un punto de venta configurado.');
            }

            $letter        = Sale::resolveVoucherLetter($customer);
            $invoiceNumber = $this->invoiceNumberService->next($pos, $letter);
            $warehouseId   = $this->resolveSaleWarehouseId($data, $pos);

            $surcharge          = round((float) ($data['surcharge'] ?? 0), 2);
            $additionalDiscount = round((float) ($data['additional_discount'] ?? 0), 2);

            $sale = Sale::create([
                'pos_number'          => $pos->pos_number,
                'voucher_letter'      => $letter,
                'invoice_number'      => $invoiceNumber,
                'tax_id'              => $customer->tax_id ?? $customer->dni,
                'date'                => now()->format('Y-m-d'),
                'discount'            => 0,
                'surcharge'           => $surcharge,
                'additional_discount' => $additionalDiscount,
                'subtotal'            => 0,
                'total'               => 0,
                'payment_status'      => PaymentStatus::Pending,
                'sale_condition'      => SaleCondition::Cash,
                'customer_id'         => $customer->id,
                'user_id'             => $user->id,
                'price_list_id'       => $data['price_list_id'] ?? null,
                'sale_type'           => $saleType,
                'point_of_sale_id'    => $pos->id,
                'warehouse_id'        => $warehouseId,
            ]);

            $subtotal = 0.0;

            foreach ($items as $item) {
                /** @var Product|null $product */
                $product = $products->get($item['product_id']);
                if (! $product) {
                    throw new RuntimeException('Uno de los artículos de la venta no existe.');
                }

                $quantity = (int) $item['quantity'];
                $price    = round((float) $item['price'], 2);
                $cost     = round((float) $product->cost, 2);

                // Piso de precio: nunca $0 ni por debajo del costo.
                if ($price <= 0) {
                    throw new RuntimeException("El precio de «{$product->name}» debe ser mayor a 0.");
                }
                if ($cost > 0 && $price < $cost) {
                    throw new RuntimeException("El precio de «{$product->name}» no puede ser menor al costo.");
                }

                // Desvío respecto del precio de lista se registra como descuento de línea.
                $listPrice    = $this->listPriceFor($product, $data['price_list_id'] ?? null);
                $lineDiscount = ($listPrice !== null && $listPrice > $price) ? round($listPrice - $price, 2) : 0;

                $itemSubtotal = round($quantity * $price, 2);

                $sale->products()->attach($product->id, [
                    'supplier_code' => $product->supplier_code,
                    'sku'           => $product->sku,
                    'name'          => $product->name,
                    'unit'          => $product->unit,
                    'quantity'      => $quantity,
                    'discount'      => $lineDiscount,
                    'tax_rate'      => $product->tax_rate,
                    'unit_price'    => $price,
                    'subtotal'      => $itemSubtotal,
                ]);

                $subtotal += $itemSubtotal;

                $itemWarehouseId = ! empty($item['warehouse_id']) ? (int) $item['warehouse_id'] : $warehouseId;

                if ($saleType === SaleType::Ecommerce) {
                    $this->deliveryService->create(
                        $sale, $product->id, $quantity, $itemWarehouseId,
                        Delivery::STATUS_PENDING,
                        now()->addDays(3),
                        'Entrega pendiente - Venta e-commerce',
                    );
                } else {
                    $isImmediate = (bool) ($data['auto_delivery'] ?? false);
                    $this->deliveryService->create(
                        $sale, $product->id, $quantity, $itemWarehouseId,
                        $isImmediate ? Delivery::STATUS_DELIVERED : Delivery::STATUS_PENDING,
                        now(),
                        $isImmediate ? 'Entrega inmediata - Venta POS' : 'Entrega pendiente - Venta POS',
                        $user->id,
                    );
                }
            }

            $total = round($subtotal + $surcharge - $additionalDiscount, 2);

            // Clamp defensivo: el pago nunca supera el total (además del tope validado en el request).
            $paymentAmount = round((float) ($data['payment_amount'] ?? 0), 2);
            if ($paymentAmount > $total) {
                $paymentAmount = $total;
            }

            $sale->update([
                'subtotal'       => $subtotal,
                'total'          => $total,
                'sale_condition' => $paymentAmount >= $total ? SaleCondition::Cash : SaleCondition::Credit,
            ]);

            if ($paymentAmount > 0) {
                SalePayment::create([
                    'sale_id'        => $sale->id,
                    'amount'         => $paymentAmount,
                    'payment_method' => $data['payment_method'],
                    'payment_date'   => now(),
                    'user_id'        => $user->id,
                ]);
            }

            $sale->recalcPaymentStatus();

            return $sale;
        });
    }

    /**
     * Actualiza recargo/descuento de una venta y recalcula total + estado de pago.
     * Bloquea la edición de ventas canceladas o ya autorizadas en AFIP.
     */
    public function update(Sale $sale, array $data): Sale
    {
        if ($sale->isCancelled()) {
            throw new RuntimeException('No se puede editar una venta cancelada.');
        }
        if ($sale->cae) {
            throw new RuntimeException('No se puede editar una factura ya autorizada en AFIP.');
        }

        return DB::transaction(function () use ($sale, $data) {
            /** @var Sale $sale */
            $sale = Sale::lockForUpdate()->findOrFail($sale->id);

            $subtotal           = (float) $sale->products->sum('pivot.subtotal');
            $surcharge          = round((float) ($data['surcharge'] ?? 0), 2);
            $additionalDiscount = round((float) ($data['additional_discount'] ?? 0), 2);
            $total              = round($subtotal + $surcharge - $additionalDiscount, 2);

            // El total no puede quedar por debajo de lo ya cobrado: dejaría un
            // saldo negativo (el cliente pagó de más) que ninguna pantalla sabe
            // representar. Si hay que bajarlo, primero se elimina un pago.
            $paid = round((float) $sale->payments()->sum('amount'), 2);
            if ($total < $paid) {
                throw new RuntimeException(
                    'El total no puede ser menor a lo ya cobrado ($' . number_format($paid, 2) . '). Eliminá un pago primero.'
                );
            }

            $sale->update([
                'surcharge'           => $surcharge,
                'additional_discount' => $additionalDiscount,
                'total'               => $total,
            ]);

            $sale->recalcPaymentStatus();

            return $sale;
        });
    }

    /**
     * Cancela una venta sin borrar el registro (estado terminal):
     * - revierte las entregas DELIVERED (repone stock),
     * - cancela las entregas PENDING (sin tocar stock),
     * - acredita lo pagado al crédito del cliente,
     * - setea payment_status = cancelled.
     */
    public function cancel(Sale $sale): void
    {
        if ($sale->isCancelled()) {
            throw new RuntimeException('La venta ya está cancelada.');
        }
        if ($sale->cae) {
            throw new RuntimeException('No se puede cancelar una factura autorizada en AFIP.');
        }

        DB::transaction(function () use ($sale) {
            /** @var Sale $sale */
            $sale = Sale::lockForUpdate()->findOrFail($sale->id);

            if ($sale->isCancelled()) {
                throw new RuntimeException('La venta ya está cancelada.');
            }

            // Revertir entregas entregadas (repone stock) y cancelar las pendientes.
            foreach ($sale->deliveries()->where('status', Delivery::STATUS_DELIVERED)->get() as $delivery) {
                $this->deliveryService->revert($delivery, 'Reversión por cancelación de venta');
            }
            $sale->deliveries()
                ->where('status', Delivery::STATUS_PENDING)
                ->update(['status' => Delivery::STATUS_CANCELLED]);

            // Acreditar lo pagado como crédito a favor del cliente.
            $totalPaid = round((float) $sale->payments()->sum('amount'), 2);
            if ($totalPaid > 0) {
                $customer = Customer::lockForUpdate()->find($sale->customer_id);
                if ($customer) {
                    $customer->credit = round((float) $customer->credit + $totalPaid, 2);
                    $customer->save();
                }
            }

            $sale->payment_status = PaymentStatus::Cancelled;
            $sale->save();
        });
    }

    private function resolvePointOfSale(array $data, User $user): ?PointOfSale
    {
        // Vendedor: SIEMPRE su PV asignado, ignorando request/session.
        if ($user->isVendedor()) {
            if (! $user->point_of_sale_id) {
                throw new RuntimeException('Tu cuenta no tiene un punto de venta asignado.');
            }
            return PointOfSale::find($user->point_of_sale_id);
        }

        if (! empty($data['point_of_sale_id'])) {
            return PointOfSale::find($data['point_of_sale_id']);
        }

        $activePos = session('active_point_of_sale_id');
        if ($activePos && $pos = PointOfSale::find($activePos)) {
            return $pos;
        }

        return PointOfSale::getDefault();
    }

    private function resolveSaleWarehouseId(array $data, ?PointOfSale $pos = null): ?int
    {
        if (! empty($data['warehouse_id'])) {
            return (int) $data['warehouse_id'];
        }

        if ($pos && $pos->warehouse_id) {
            return (int) $pos->warehouse_id;
        }

        return Warehouse::isDefault()->value('id');
    }

    private function listPriceFor(Product $product, $priceListId): ?float
    {
        if (! $priceListId) {
            return null;
        }

        $priceList = $product->priceLists->firstWhere('id', (int) $priceListId);

        return $priceList ? (float) $priceList->pivot->price : null;
    }
}
