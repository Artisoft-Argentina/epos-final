<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Services\DeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EntregaController extends Controller
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

        return Inertia::render('Entregas/Index', [
            'entregas'              => $query->paginate(20),
            'warehouses'            => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(['id', 'name', 'is_default']),
            'selected_status'       => $status ?? Delivery::STATUS_PENDING,
            'selected_warehouse_id' => $warehouseId,
            'selected_sale_id'      => $saleId ? (int) $saleId : null,
        ]);
    }

    public function create(Sale $factura)
    {
        return Inertia::render('Entregas/Create', [
            'factura'    => $factura->load(['customer', 'products', 'deliveries.warehouse']),
            'warehouses' => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(['id', 'name', 'is_default']),
        ]);
    }

    public function store(Request $request, Sale $factura)
    {
        $request->validate([
            'entregas'                  => 'required|array|min:1',
            'entregas.*.articulo_id'    => 'required|exists:products,id',
            'entregas.*.cantidad'       => 'required|integer|min:1',
            'entregas.*.warehouse_id'   => 'required|exists:warehouses,id',
            'fecha_entrega'             => 'required|date',
            'observaciones'             => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($request, $factura) {
                foreach ($request->entregas as $entregaData) {
                    $this->deliveryService->create(
                        $factura,
                        (int) $entregaData['articulo_id'],
                        (int) $entregaData['cantidad'],
                        (int) $entregaData['warehouse_id'],
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

        return redirect()->route('ventas.index')->with('success', 'Entrega registrada y stock descontado exitosamente');
    }

    public function marcarEntregada(Request $request, Delivery $entrega)
    {
        $request->validate(['warehouse_id' => 'required|exists:warehouses,id']);

        if ($entrega->isDelivered()) {
            return back()->with('error', 'Esta entrega ya fue completada');
        }

        try {
            $this->deliveryService->markDelivered(
                $entrega,
                (int) $request->warehouse_id,
                auth()->id(),
            );
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Entrega marcada como completada');
    }

    public function cancelar(Delivery $entrega)
    {
        if ($entrega->isDelivered()) {
            return back()->with('error', 'No se puede cancelar una entrega ya completada. Use revertir desde la venta.');
        }

        $entrega->update(['status' => Delivery::STATUS_CANCELLED]);

        return back()->with('success', 'Entrega cancelada');
    }

    public function updateWarehouse(Request $request, Delivery $entrega)
    {
        if ($entrega->isDelivered()) {
            return back()->with('error', 'No se puede cambiar el almacén de una entrega ya completada.');
        }

        $request->validate(['warehouse_id' => 'required|exists:warehouses,id']);
        $entrega->update(['warehouse_id' => $request->warehouse_id]);

        return back()->with('success', 'Almacén de entrega actualizado.');
    }

    public function destroy(Delivery $entrega)
    {
        DB::transaction(function () use ($entrega) {
            if ($entrega->isDelivered()) {
                $this->deliveryService->revert($entrega, 'Reversión por eliminación de entrega');
            }
            $entrega->delete();
        });

        return back()->with('success', 'Entrega eliminada exitosamente');
    }
}
