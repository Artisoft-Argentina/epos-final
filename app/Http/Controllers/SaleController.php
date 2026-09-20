<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Customer;
use App\Models\Sale;
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

        return Inertia::render('Sales/Create', [
            'customers'      => Customer::all(),
            // Solo artículos activos: uno dado de baja no debe poder venderse.
            'products'       => Product::active()->with(['category', 'brand', 'priceLists', 'images'])->get(),
            'priceLists'     => $priceLists,
            'defaultPosList' => $defaultPosList,
            'pointsOfSale'   => PointOfSale::active()->orderBy('is_default', 'desc')->orderBy('name')->get(),
            'warehouses'     => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(),
        ]);
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
