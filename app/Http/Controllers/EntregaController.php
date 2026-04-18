<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\Sale;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Services\MovimientoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EntregaController extends Controller
{
    public function __construct(private MovimientoService $movimientoService) {}

    public function index()
    {
        $entregas = Delivery::with(['sale.customer', 'product'])
            ->pending()
            ->orderBy('delivery_date', 'asc')
            ->paginate(20);

        return Inertia::render('Entregas/Index', ['entregas' => $entregas]);
    }

    public function create(Sale $factura)
    {
        return Inertia::render('Entregas/Create', [
            'factura' => $factura->load(['customer', 'products', 'deliveries']),
        ]);
    }

    public function store(Request $request, Sale $factura)
    {
        $request->validate([
            'entregas'                  => 'required|array|min:1',
            'entregas.*.articulo_id'    => 'required|exists:products,id',
            'entregas.*.cantidad'       => 'required|integer|min:1',
            'fecha_entrega'             => 'required|date',
            'observaciones'             => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $factura) {
            foreach ($request->entregas as $entregaData) {
                $stock = Stock::where('product_id', $entregaData['articulo_id'])->first();

                if ($stock) {
                    if ($stock->quantity < $entregaData['cantidad']) {
                        throw new \Exception('Stock insuficiente para el producto ID: ' . $entregaData['articulo_id']);
                    }
                    $stock->decrement('quantity', $entregaData['cantidad']);
                }

                $delivery = Delivery::create([
                    'sale_id'              => $factura->id,
                    'product_id'           => $entregaData['articulo_id'],
                    'quantity'             => $entregaData['cantidad'],
                    'delivery_date'        => $request->fecha_entrega,
                    'notes'                => $request->observaciones,
                    'status'               => Delivery::STATUS_DELIVERED,
                    'actual_delivery_date' => now(),
                ]);

                if ($stock) {
                    $this->movimientoService->registrar(
                        $stock, StockMovement::TYPE_DELIVERY_EXIT,
                        $entregaData['cantidad'], $delivery
                    );
                }
            }
        });

        return redirect()->route('ventas.index')->with('success', 'Entrega registrada y stock descontado exitosamente');
    }

    public function marcarEntregada(Delivery $entrega)
    {
        if ($entrega->isDelivered()) {
            return back()->with('error', 'Esta entrega ya fue completada');
        }

        DB::transaction(function () use ($entrega) {
            $stock = Stock::where('product_id', $entrega->product_id)->first();

            if ($stock) {
                if ($stock->quantity < $entrega->quantity) {
                    throw new \Exception('Stock insuficiente para completar la entrega');
                }
                $stock->decrement('quantity', $entrega->quantity);

                $this->movimientoService->registrar(
                    $stock, StockMovement::TYPE_DELIVERY_EXIT,
                    $entrega->quantity, $entrega
                );
            }

            $entrega->markAsDelivered();
        });

        return back()->with('success', 'Entrega marcada como completada');
    }

    public function cancelar(Delivery $entrega)
    {
        if ($entrega->isDelivered()) {
            return back()->with('error', 'No se puede cancelar una entrega ya completada');
        }

        $entrega->update(['status' => Delivery::STATUS_CANCELLED]);

        return back()->with('success', 'Entrega cancelada');
    }

    public function destroy(Delivery $entrega)
    {
        DB::transaction(function () use ($entrega) {
            if ($entrega->isDelivered()) {
                $stock = Stock::where('product_id', $entrega->product_id)->first();
                if ($stock) {
                    $stock->increment('quantity', $entrega->quantity);

                    $this->movimientoService->registrar(
                        $stock, StockMovement::TYPE_RETURN,
                        $entrega->quantity, $entrega, null,
                        'Reversión por eliminación de entrega'
                    );
                }
            }

            $entrega->delete();
        });

        return back()->with('success', 'Entrega eliminada exitosamente');
    }
}
