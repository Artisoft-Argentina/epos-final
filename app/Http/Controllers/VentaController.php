<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\Stock;
use App\Models\PriceList;
use App\Models\StockMovement;
use App\Models\SalePayment;
use App\Models\Delivery;
use App\Models\Warehouse;
use App\Models\PointOfSale;
use App\Services\AfipService;
use App\Services\DeliveryService;
use App\Services\InvoiceNumberService;
use App\Services\MovimientoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class VentaController extends Controller
{
    public function __construct(
        private MovimientoService $movimientoService,
        private InvoiceNumberService $invoiceNumberService,
        private DeliveryService $deliveryService,
    ) {}

    public function index()
    {
        $query = Sale::with(['customer', 'user', 'products', 'deliveries'])->latest();

        $user = auth()->user();
        if ($user && $user->isVendedor()) {
            $query->where('user_id', $user->id)
                  ->where('point_of_sale_id', $user->point_of_sale_id);
        }

        return Inertia::render('Ventas/Index', [
            'facturas' => $query->paginate(5),
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        if ($user && $user->isVendedor() && ! $user->point_of_sale_id) {
            return redirect()->route('dashboard')->with('error', 'Tu cuenta no tiene un punto de venta asignado. Contactá al administrador.');
        }

        $priceLists      = PriceList::all();
        $defaultPosList  = $priceLists->where('default_pos', true)->first();

        return Inertia::render('Ventas/Create', [
            'clientes'        => Customer::all(),
            'articulos'       => Product::with(['category', 'brand', 'priceLists', 'images'])->get(),
            'listasPrecios'   => $priceLists,
            'listaDefaultPos' => $defaultPosList,
            'puntosVenta'     => PointOfSale::active()->orderBy('is_default', 'desc')->orderBy('name')->get(),
            'almacenes'       => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id'                  => 'required|exists:customers,id',
            'articulos'                    => 'required|array|min:1',
            'articulos.*.articulo_id'      => 'required|exists:products,id',
            'articulos.*.cantidad'         => 'required|integer|min:1',
            'articulos.*.precio'           => 'required|numeric|min:0',
            'articulos.*.warehouse_id'     => 'nullable|exists:warehouses,id',
            'articulos.*.delivery_mode'    => 'nullable|in:immediate,pending,transfer_request',
            'surcharge'                    => 'nullable|numeric|min:0',
            'additional_discount'          => 'nullable|numeric|min:0',
            'payment_method'               => 'required|string',
            'payment_amount'               => 'required|numeric|min:0',
            'auto_payment'                 => 'boolean',
            'auto_delivery'                => 'boolean',
            'price_list_id'                => 'nullable|exists:price_lists,id',
            'sale_type'                    => 'nullable|in:pos,ecommerce',
            'point_of_sale_id'             => 'nullable|exists:points_of_sale,id',
            'voucher_letter'               => 'nullable|in:A,B,C',
        ]);

        $sale = DB::transaction(function () use ($request) {
            $customer  = Customer::find($request->customer_id);
            $subtotal  = 0;
            $saleType  = $request->sale_type ?? $this->determineSaleType($request);

            $pos = $this->resolvePointOfSale($request);
            if (! $pos) {
                throw new \RuntimeException('No hay un punto de venta configurado.');
            }

            $letter         = strtoupper($request->voucher_letter ?? $pos->voucher_letter_default ?? 'B');
            $invoiceNumber  = $this->invoiceNumberService->next($pos, $letter);
            $warehouseId    = $this->resolveSaleWarehouseId($request, $pos);

            $sale = Sale::create([
                'pos_number'          => $pos->pos_number,
                'voucher_letter'      => $letter,
                'invoice_number'      => $invoiceNumber,
                'tax_id'              => $customer->tax_id ?? $customer->dni,
                'date'                => now()->format('Y-m-d'),
                'discount'            => 0,
                'surcharge'           => $request->surcharge ?? 0,
                'additional_discount' => $request->additional_discount ?? 0,
                'subtotal'            => 0,
                'total'               => 0,
                'payment_status'      => 'SI',
                'sale_condition'      => 'CONTADO',
                'customer_id'         => $request->customer_id,
                'user_id'             => auth()->id(),
                'price_list_id'       => $request->price_list_id,
                'sale_type'           => $saleType,
                'point_of_sale_id'    => $pos->id,
                'warehouse_id'        => $warehouseId,
            ]);

            foreach ($request->articulos as $item) {
                $product      = Product::find($item['articulo_id']);
                $quantity     = $item['cantidad'];
                $price        = $item['precio'];
                $itemSubtotal = $quantity * $price;

                $sale->products()->attach($product->id, [
                    'supplier_code' => $product->supplier_code,
                    'sku'           => $product->sku,
                    'name'          => $product->name,
                    'unit'          => $product->unit,
                    'quantity'      => $quantity,
                    'discount'      => 0,
                    'tax_rate'      => $product->tax_rate,
                    'unit_price'    => $price,
                    'subtotal'      => $itemSubtotal,
                ]);

                $subtotal += $itemSubtotal;

                $itemWarehouseId = isset($item['warehouse_id']) && $item['warehouse_id']
                    ? (int) $item['warehouse_id']
                    : $warehouseId;

                if ($saleType === 'ecommerce') {
                    $this->deliveryService->create(
                        $sale, $product->id, $quantity, $itemWarehouseId,
                        Delivery::STATUS_PENDING,
                        now()->addDays(3),
                        'Entrega pendiente - Venta e-commerce',
                    );
                } else {
                    $isImmediate = (bool) $request->auto_delivery;
                    $this->deliveryService->create(
                        $sale, $product->id, $quantity, $itemWarehouseId,
                        $isImmediate ? Delivery::STATUS_DELIVERED : Delivery::STATUS_PENDING,
                        now(),
                        $isImmediate ? 'Entrega inmediata - Venta POS' : 'Entrega pendiente - Venta POS',
                        auth()->id(),
                    );
                }
            }

            $surcharge           = $request->surcharge ?? 0;
            $additionalDiscount  = $request->additional_discount ?? 0;
            $total               = $subtotal + $surcharge - $additionalDiscount;

            $sale->update([
                'subtotal'       => $subtotal,
                'total'          => $total,
                'payment_status' => $request->payment_amount >= $total ? 'SI' : 'NO',
            ]);

            if ($request->payment_amount > 0) {
                SalePayment::create([
                    'sale_id'        => $sale->id,
                    'amount'         => $request->payment_amount,
                    'payment_method' => $request->payment_method,
                    'payment_date'   => now(),
                ]);
            }

            return $sale;
        });

        return redirect()->route('ventas.index')->with('success', 'Venta realizada exitosamente');
    }

    private function determineSaleType(Request $request): string
    {
        if (str_contains($request->headers->get('referer', ''), 'ecommerce') ||
            str_contains($request->url(), 'ecommerce')) {
            return 'ecommerce';
        }
        return 'pos';
    }

    private function resolvePointOfSale(Request $request): ?PointOfSale
    {
        // Vendedor: SIEMPRE su PV asignado, ignorando lo que venga del request o de session.
        $user = auth()->user();
        if ($user && $user->isVendedor()) {
            abort_if(! $user->point_of_sale_id, 403, 'Tu cuenta no tiene un punto de venta asignado.');
            return PointOfSale::find($user->point_of_sale_id);
        }

        // Admin/superadmin: respetar el flujo actual.
        if ($request->filled('point_of_sale_id')) {
            return PointOfSale::find($request->input('point_of_sale_id'));
        }

        $activePos = session('active_point_of_sale_id');
        if ($activePos) {
            $pos = PointOfSale::find($activePos);
            if ($pos) return $pos;
        }

        return PointOfSale::getDefault();
    }

    private function resolveSaleWarehouseId(Request $request, ?PointOfSale $pos = null): ?int
    {
        if ($request->filled('warehouse_id')) {
            return (int) $request->input('warehouse_id');
        }

        if ($pos && $pos->warehouse_id) {
            return (int) $pos->warehouse_id;
        }

        return Warehouse::isDefault()->value('id');
    }

    public function show(Sale $venta)
    {
        return Inertia::render('Ventas/Show', [
            'factura'    => $venta->load(['customer', 'user', 'products', 'payments', 'deliveries.product', 'deliveries.warehouse']),
            'warehouses' => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function edit(Sale $venta)
    {
        if ($venta->cae) {
            return redirect()->route('ventas.index')->with('error', 'No se puede editar una factura ya autorizada en AFIP');
        }

        return Inertia::render('Ventas/Edit', [
            'factura' => $venta->load(['customer', 'user', 'products']),
        ]);
    }

    public function update(Request $request, Sale $venta)
    {
        if ($venta->cae) {
            return redirect()->route('ventas.index')->with('error', 'No se puede editar una factura ya autorizada en AFIP');
        }

        $request->validate([
            'surcharge'           => 'nullable|numeric|min:0',
            'additional_discount' => 'nullable|numeric|min:0',
        ]);

        $subtotal           = $venta->products->sum('pivot.subtotal');
        $surcharge          = $request->surcharge ?? 0;
        $additionalDiscount = $request->additional_discount ?? 0;
        $total              = $subtotal + $surcharge - $additionalDiscount;

        $venta->update([
            'surcharge'           => $surcharge,
            'additional_discount' => $additionalDiscount,
            'total'               => $total,
        ]);

        return redirect()->route('ventas.index')->with('success', 'Factura actualizada exitosamente');
    }

    public function destroy(Sale $venta)
    {
        DB::transaction(function () use ($venta) {
            foreach ($venta->deliveries()->where('status', Delivery::STATUS_DELIVERED)->get() as $delivery) {
                $this->deliveryService->revert($delivery, 'Reversión por eliminación de factura');
            }

            $venta->delete();
        });

        return redirect()->route('ventas.index')->with('success', 'Venta eliminada exitosamente');
    }

    public function autorizarAfip(Sale $factura)
    {
        try {
            $afipService = new AfipService();
            $resultado   = $afipService->autorizarFactura($factura);

            if ($resultado['success']) {
                return redirect()->route('ventas.index')
                    ->with('success', 'Factura autorizada en AFIP correctamente. CAE: ' . $resultado['cae']);
            }

            return redirect()->route('ventas.index')
                ->with('error', 'Error al autorizar en AFIP: ' . $resultado['error']);
        } catch (\Exception $e) {
            return redirect()->route('ventas.index')
                ->with('error', 'Error al autorizar en AFIP: ' . $e->getMessage());
        }
    }
}
