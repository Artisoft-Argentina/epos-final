<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Services\DeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DeliveryController extends Controller
{
    public function __construct(private DeliveryService $deliveryService) {}

    public function index(Request $request)
    {
        $query = Delivery::with(['sale.customer', 'product', 'warehouse'])
            ->orderBy('delivery_date', 'asc');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        } else {
            $query->where('status', Delivery::STATUS_PENDING);
        }

        if ($warehouseId = $request->input('warehouse_id')) {
            $query->where('warehouse_id', $warehouseId);
        }

        if ($saleId = $request->input('sale_id')) {
            $query->where('sale_id', $saleId);
        }

        return Inertia::render('Deliveries/Index', [
            'entregas'              => $query->paginate(20),
            'warehouses'            => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(['id', 'name', 'is_default']),
            'selected_status'       => $status ?? Delivery::STATUS_PENDING,
            'selected_warehouse_id' => $warehouseId,
            'selected_sale_id'      => $saleId ? (int) $saleId : null,
        ]);
    }

    public function create(Sale $sale)
    {
        return Inertia::render('Deliveries/Create', [
            'factura'    => $sale->load(['customer', 'products', 'deliveries.warehouse']),
            'warehouses' => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(['id', 'name', 'is_default']),
        ]);
    }

    public function store(Request $request, Sale $sale)
    {
        $request->validate([
            'entregas'                  => 'required|array|min:1',
            'entregas.*.articulo_id'    => 'required|exists:products,id',
            'entregas.*.cantidad'       => 'required|integer|min:1',
            'entregas.*.warehouse_id'   => 'required|exists:warehouses,id',
            'fecha_entrega'             => 'required|date',
            'observaciones'             => 'nullable|string',
        ]);

        if ($sale->isCancelled()) {
            return back()->with('error', 'No se pueden registrar entregas de una venta cancelada.');
        }

        try {
            DB::transaction(function () use ($request, $sale) {
                // Lock sobre la venta: serializa doble submit / concurrencia.
                $lockedSale = Sale::lockForUpdate()->findOrFail($sale->id);

                if ($lockedSale->isCancelled()) {
                    throw new \RuntimeException('No se pueden registrar entregas de una venta cancelada.');
                }

                // Cantidades vendidas y ya entregadas por producto.
                $soldByProduct = $lockedSale->products()->get()
                    ->groupBy('id')
                    ->map(fn ($rows) => (int) $rows->sum(fn ($p) => (int) $p->pivot->quantity));

                $deliveredByProduct = $lockedSale->deliveries()
                    ->where('status', Delivery::STATUS_DELIVERED)
                    ->get()
                    ->groupBy('product_id')
                    ->map(fn ($rows) => (int) $rows->sum('quantity'));

                $requestedByProduct = [];

                foreach ($request->entregas as $deliveryData) {
                    $productId = (int) $deliveryData['articulo_id'];
                    $quantity  = (int) $deliveryData['cantidad'];

                    $requestedByProduct[$productId] = ($requestedByProduct[$productId] ?? 0) + $quantity;

                    $sold             = (int) ($soldByProduct[$productId] ?? 0);
                    $delivered        = (int) ($deliveredByProduct[$productId] ?? 0);
                    $pendingToDeliver = $sold - $delivered;

                    if ($requestedByProduct[$productId] > $pendingToDeliver) {
                        throw new \RuntimeException("No se puede entregar más de lo pendiente (pendiente: {$pendingToDeliver}).");
                    }

                    $this->deliveryService->create(
                        $lockedSale,
                        $productId,
                        $quantity,
                        (int) $deliveryData['warehouse_id'],
                        Delivery::STATUS_DELIVERED,
                        \Carbon\Carbon::parse($request->fecha_entrega),
                        $request->observaciones,
                        auth()->id(),
                    );
                }
            });
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('sales.index')->with('success', 'Entrega registrada y stock descontado exitosamente');
    }

    public function markDelivered(Request $request, Delivery $delivery)
    {
        $request->validate(['warehouse_id' => 'required|exists:warehouses,id']);

        if ($delivery->sale && $delivery->sale->isCancelled()) {
            return back()->with('error', 'No se pueden entregar ítems de una venta cancelada.');
        }

        if ($delivery->isDelivered()) {
            return back()->with('error', 'Esta entrega ya fue completada');
        }

        try {
            $this->deliveryService->markDelivered(
                $delivery,
                (int) $request->warehouse_id,
                auth()->id(),
            );
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Entrega marcada como completada');
    }

    public function cancel(Delivery $delivery)
    {
        if ($delivery->isDelivered()) {
            return back()->with('error', 'No se puede cancelar una entrega ya completada. Use revertir desde la venta.');
        }

        $delivery->update(['status' => Delivery::STATUS_CANCELLED]);

        return back()->with('success', 'Entrega cancelada');
    }

    public function updateWarehouse(Request $request, Delivery $delivery)
    {
        if ($delivery->isDelivered()) {
            return back()->with('error', 'No se puede cambiar el almacén de una entrega ya completada.');
        }

        $request->validate(['warehouse_id' => 'required|exists:warehouses,id']);
        $delivery->update(['warehouse_id' => $request->warehouse_id]);

        return back()->with('success', 'Almacén de entrega actualizado.');
    }

    public function destroy(Delivery $delivery)
    {
        DB::transaction(function () use ($delivery) {
            if ($delivery->isDelivered()) {
                $this->deliveryService->revert($delivery, 'Reversión por eliminación de entrega');
            }
            $delivery->delete();
        });

        return back()->with('success', 'Entrega eliminada exitosamente');
    }
}
