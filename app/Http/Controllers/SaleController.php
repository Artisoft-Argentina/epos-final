<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\Stock;
use App\Models\PriceList;
use App\Models\Warehouse;
use App\Models\PointOfSale;
use App\Services\AfipService;
use App\Services\SaleService;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\UpdateSaleRequest;
use Inertia\Inertia;

class SaleController extends Controller
{
    public function __construct(
        private readonly SaleService $saleService,
    ) {}

    public function index()
    {
        $query = Sale::with(['customer', 'user', 'products', 'deliveries'])->latest();

        $user = auth()->user();
        if ($user && $user->isVendedor()) {
            $query->where('user_id', $user->id)
                  ->where('point_of_sale_id', $user->point_of_sale_id);
        }

        return Inertia::render('Sales/Index', [
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

        // `warehouse` hace falta para la barra de contexto del POS, que nombra
        // el almacén que va a descontar la venta.
        $pointsOfSale = PointOfSale::active()
            ->with('warehouse:id,name')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        $warehouses = Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get();

        // Mismo criterio que HandleInertiaRequests: vendedor usa su PV, el resto
        // el de la sesión y, si no eligió, el predeterminado.
        $activePosId = $user && $user->isVendedor()
            ? $user->point_of_sale_id
            : (session('active_point_of_sale_id') ?? $pointsOfSale->firstWhere('is_default', true)?->id);

        $activePos      = $pointsOfSale->firstWhere('id', $activePosId) ?? $pointsOfSale->first();
        $posWarehouseId = $activePos?->warehouse_id
            ?? $warehouses->firstWhere('is_default', true)?->id
            ?? $warehouses->first()?->id;

        return Inertia::render('Sales/Create', [
            'customers'      => Customer::all(),
            // Solo artículos activos: uno dado de baja no debe poder venderse.
            'products'       => Product::active()->with(['category', 'brand', 'priceLists', 'images'])->get(),
            'priceLists'     => $priceLists,
            'defaultPosList' => $defaultPosList,
            'pointsOfSale'   => $pointsOfSale,
            'warehouses'     => $warehouses,
            // Stock del almacén del punto de venta, para mostrarlo en el catálogo.
            // Es una sola consulta agregada —no una por artículo—: el detalle por
            // almacén se sigue pidiendo bajo demanda al agregar el artículo.
            'posStock'       => $posWarehouseId
                ? Stock::where('warehouse_id', $posWarehouseId)
                    ->pluck('quantity', 'product_id')
                    ->map(fn ($quantity) => (int) $quantity)
                : [],
            'customerBalances' => $this->customerBalances(),
            'paymentMethods'   => SalePayment::METHOD_LABELS,
        ]);
    }

    /**
     * Saldo pendiente por cliente, para el chip del comprobante.
     *
     * Son dos agregados sobre toda la tabla en lugar de un endpoint por cliente:
     * el vendedor necesita el saldo en el momento en que elige el cliente, no un
     * segundo después. Las ventas canceladas quedan afuera, igual que en el
     * estado de cuenta (CustomerController::accountStatement).
     *
     * @return array<int, float>
     */
    private function customerBalances(): array
    {
        $cancelled = PaymentStatus::Cancelled->value;

        $invoiced = Sale::whereNot('payment_status', $cancelled)
            ->groupBy('customer_id')
            ->selectRaw('customer_id, SUM(total) AS amount')
            ->pluck('amount', 'customer_id');

        $paid = SalePayment::join('sales', 'sales.id', '=', 'sale_payments.sale_id')
            ->whereNot('sales.payment_status', $cancelled)
            ->whereNull('sale_payments.deleted_at')
            ->groupBy('sales.customer_id')
            ->selectRaw('sales.customer_id, SUM(sale_payments.amount) AS amount')
            ->pluck('amount', 'customer_id');

        return $invoiced
            ->mapWithKeys(fn ($amount, $customerId) => [
                (int) $customerId => round((float) $amount - (float) ($paid[$customerId] ?? 0), 2),
            ])
            ->filter(fn ($balance) => $balance > 0)
            ->all();
    }

    public function store(StoreSaleRequest $request)
    {
        try {
            $this->saleService->create($request->validated(), $request->user());
        } catch (\RuntimeException $e) {
            return back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()->route('sales.index')->with('success', 'Venta realizada exitosamente');
    }

    public function show(Sale $sale)
    {
        return Inertia::render('Sales/Show', [
            'factura'    => $sale->load(['customer', 'user', 'products', 'payments', 'deliveries.product', 'deliveries.warehouse']),
            'warehouses' => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function edit(Sale $sale)
    {
        if ($sale->isCancelled()) {
            return redirect()->route('sales.index')->with('error', 'No se puede editar una venta cancelada');
        }

        if ($sale->cae) {
            return redirect()->route('sales.index')->with('error', 'No se puede editar una factura ya autorizada en AFIP');
        }

        return Inertia::render('Sales/Edit', [
            'factura' => $sale->load(['customer', 'user', 'products']),
        ]);
    }

    public function update(UpdateSaleRequest $request, Sale $sale)
    {
        try {
            $this->saleService->update($sale, $request->validated());
        } catch (\RuntimeException $e) {
            return redirect()->route('sales.index')->with('error', $e->getMessage());
        }

        return redirect()->route('sales.index')->with('success', 'Factura actualizada exitosamente');
    }

    public function cancel(Sale $sale)
    {
        try {
            $this->saleService->cancel($sale);
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('sales.index')->with('success', 'Venta cancelada exitosamente');
    }

    public function authorizeAfip(Sale $sale)
    {
        try {
            $afipService = new AfipService();
            $resultado   = $afipService->autorizarFactura($sale);

            if ($resultado['success']) {
                return redirect()->route('sales.index')
                    ->with('success', 'Factura autorizada en AFIP correctamente. CAE: ' . $resultado['cae']);
            }

            return redirect()->route('sales.index')
                ->with('error', 'Error al autorizar en AFIP: ' . $resultado['error']);
        } catch (\Exception $e) {
            return redirect()->route('sales.index')
                ->with('error', 'Error al autorizar en AFIP: ' . $e->getMessage());
        }
    }
}
