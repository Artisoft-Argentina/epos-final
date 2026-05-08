<?php

namespace App\Http\Controllers;

use App\Models\StockTransfer;
use App\Models\Warehouse;
use App\Models\Stock;
use App\Services\StockTransferService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    public function __construct(private StockTransferService $service) {}

    public function index(Request $request)
    {
        $query = StockTransfer::with(['originWarehouse', 'destinationWarehouse', 'requestedBy'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('warehouse_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('origin_warehouse_id', $request->warehouse_id)
                  ->orWhere('destination_warehouse_id', $request->warehouse_id);
            });
        }

        return Inertia::render('Inventario/Transferencias/Index', [
            'transfers'  => $query->paginate(15),
            'warehouses' => Warehouse::active()->orderBy('name')->get(),
            'filters'    => $request->only(['status', 'warehouse_id']),
        ]);
    }

    public function create()
    {
        $warehouses = Warehouse::active()->orderBy('name')->get();

        return Inertia::render('Inventario/Transferencias/Create', [
            'warehouses' => $warehouses,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'origin_warehouse_id'      => 'required|exists:warehouses,id',
            'destination_warehouse_id' => 'required|exists:warehouses,id|different:origin_warehouse_id',
            'notes'                    => 'nullable|string',
            'items'                    => 'required|array|min:1',
            'items.*.product_id'       => 'required|exists:products,id',
            'items.*.quantity'         => 'required|integer|min:1',
        ]);

        $transfer = $this->service->request(
            $data['origin_warehouse_id'],
            $data['destination_warehouse_id'],
            $data['items'],
            auth()->id(),
            $data['notes'] ?? null
        );

        return redirect()->route('transferencias.show', $transfer->id)
            ->with('success', 'Transferencia creada exitosamente.');
    }

    public function show(StockTransfer $transferencia)
    {
        $transferencia->load([
            'originWarehouse',
            'destinationWarehouse',
            'requestedBy',
            'receivedBy',
            'items.product',
        ]);

        return Inertia::render('Inventario/Transferencias/Show', [
            'transfer' => $transferencia,
        ]);
    }

    public function dispatchTransfer(StockTransfer $transferencia)
    {
        $this->service->dispatch($transferencia);

        return back()->with('success', 'Transferencia despachada exitosamente.');
    }

    public function receive(Request $request, StockTransfer $transferencia)
    {
        $receivedQuantities = null;

        if ($request->has('received_quantities')) {
            $request->validate([
                'received_quantities'   => 'array',
                'received_quantities.*' => 'integer|min:0',
            ]);
            $receivedQuantities = $request->input('received_quantities');
        }

        $this->service->receive($transferencia, $receivedQuantities);

        return back()->with('success', 'Transferencia recibida exitosamente.');
    }

    public function cancel(StockTransfer $transferencia)
    {
        $this->service->cancel($transferencia);

        return back()->with('success', 'Transferencia cancelada.');
    }

    /**
     * API: stock disponible en un almacén para el buscador de productos.
     */
    public function availableStock(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'search'       => 'nullable|string|min:1',
        ]);

        $stocks = Stock::where('warehouse_id', $request->warehouse_id)
            ->where('quantity', '>', 0)
            ->with('product')
            ->when($request->search, function ($q, $search) {
                $q->whereHas('product', fn ($pq) => $pq->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%"));
            })
            ->limit(20)
            ->get()
            ->map(fn ($s) => [
                'product_id'   => $s->product_id,
                'product_name' => $s->product->name,
                'product_code' => $s->product->code ?? '',
                'available'    => $s->quantity,
            ]);

        return response()->json($stocks);
    }
}
