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

class VentaController extends Controller
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
            'customers'      => Customer::all(),
            'products'       => Product::with(['category', 'brand', 'priceLists', 'images'])->get(),
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

        return redirect()->route('ventas.index')->with('success', 'Venta realizada exitosamente');
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
        if ($venta->isCancelled()) {
            return redirect()->route('ventas.index')->with('error', 'No se puede editar una venta cancelada');
        }

        if ($venta->cae) {
            return redirect()->route('ventas.index')->with('error', 'No se puede editar una factura ya autorizada en AFIP');
        }

        return Inertia::render('Ventas/Edit', [
            'factura' => $venta->load(['customer', 'user', 'products']),
        ]);
    }

    public function update(UpdateSaleRequest $request, Sale $venta)
    {
        try {
            $this->saleService->update($venta, $request->validated());
        } catch (\RuntimeException $e) {
            return redirect()->route('ventas.index')->with('error', $e->getMessage());
        }

        return redirect()->route('ventas.index')->with('success', 'Factura actualizada exitosamente');
    }

    public function cancel(Sale $venta)
    {
        try {
            $this->saleService->cancel($venta);
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('ventas.index')->with('success', 'Venta cancelada exitosamente');
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
