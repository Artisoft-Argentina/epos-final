<?php

namespace App\Http\Controllers;

use App\Models\Entrega;
use App\Models\Factura;
use App\Models\Inventario;
use App\Models\Movimiento;
use App\Services\MovimientoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EntregaController extends Controller
{
    public function __construct(private MovimientoService $movimientoService) {}
    // Listar entregas pendientes
    public function index()
    {
        $entregas = Entrega::with(['factura.cliente', 'articulo'])
            ->pendientes()
            ->orderBy('fecha_entrega', 'asc')
            ->paginate(20);

        return Inertia::render('Entregas/Index', [
            'entregas' => $entregas,
        ]);
    }

    // Crear nueva entrega
    public function create(Factura $factura)
    {
        return Inertia::render('Entregas/Create', [
            'factura' => $factura->load(['cliente', 'articulos', 'entregas']),
        ]);
    }

    public function store(Request $request, Factura $factura)
    {
        $request->validate([
            'entregas' => 'required|array|min:1',
            'entregas.*.articulo_id' => 'required|exists:articulos,id',
            'entregas.*.cantidad' => 'required|integer|min:1',
            'fecha_entrega' => 'required|date',
            'observaciones' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $factura) {
            foreach ($request->entregas as $entregaData) {
                // Descontar del inventario inmediatamente
                $inventario = Inventario::where('articulo_id', $entregaData['articulo_id'])->first();
                if ($inventario) {
                    if ($inventario->cantidad < $entregaData['cantidad']) {
                        throw new \Exception('Stock insuficiente para el artículo ID: ' . $entregaData['articulo_id']);
                    }
                    $inventario->cantidad -= $entregaData['cantidad'];
                    $inventario->save();
                }

                // Crear entrega como ENTREGADA (no pendiente)
                $entrega = Entrega::create([
                    'factura_id' => $factura->id,
                    'articulo_id' => $entregaData['articulo_id'],
                    'cantidad' => $entregaData['cantidad'],
                    'fecha_entrega' => $request->fecha_entrega,
                    'observaciones' => $request->observaciones,
                    'estado' => 'entregada',
                    'fecha_entrega_real' => now(),
                ]);

                if ($inventario) {
                    $this->movimientoService->registrar(
                        $inventario,
                        Movimiento::TIPO_SALIDA_ENTREGA,
                        $entregaData['cantidad'],
                        $entrega
                    );
                }
            }
        });

        return redirect()->route('ventas.index')
            ->with('success', 'Entrega registrada y stock descontado exitosamente');
    }

    // Marcar entrega como completada
    public function marcarEntregada(Entrega $entrega)
    {
        if ($entrega->isEntregada()) {
            return back()->with('error', 'Esta entrega ya fue completada');
        }

        DB::transaction(function () use ($entrega) {
            // Descontar del inventario
            $inventario = Inventario::where('articulo_id', $entrega->articulo_id)->first();
            if ($inventario) {
                if ($inventario->cantidad < $entrega->cantidad) {
                    throw new \Exception('Stock insuficiente para completar la entrega');
                }
                $inventario->cantidad -= $entrega->cantidad;
                $inventario->save();

                $this->movimientoService->registrar(
                    $inventario,
                    Movimiento::TIPO_SALIDA_ENTREGA,
                    $entrega->cantidad,
                    $entrega
                );
            }

            // Marcar como entregada
            $entrega->marcarComoEntregada();
        });

        return back()->with('success', 'Entrega marcada como completada');
    }

    // Cancelar entrega
    public function cancelar(Entrega $entrega)
    {
        if ($entrega->isEntregada()) {
            return back()->with('error', 'No se puede cancelar una entrega ya completada');
        }

        $entrega->update(['estado' => 'cancelada']);

        return back()->with('success', 'Entrega cancelada');
    }

    public function destroy(Entrega $entrega)
    {
        DB::transaction(function () use ($entrega) {
            // Si la entrega ya fue completada, restaurar inventario
            if ($entrega->isEntregada()) {
                $inventario = Inventario::where('articulo_id', $entrega->articulo_id)->first();
                if ($inventario) {
                    $inventario->cantidad += $entrega->cantidad;
                    $inventario->save();

                    $this->movimientoService->registrar(
                        $inventario,
                        Movimiento::TIPO_DEVOLUCION,
                        $entrega->cantidad,
                        $entrega,
                        null,
                        'Reversión por eliminación de entrega'
                    );
                }
            }

            $entrega->delete();
        });

        return back()->with('success', 'Entrega eliminada exitosamente');
    }
}
