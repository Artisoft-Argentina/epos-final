<?php

namespace App\Http\Controllers;

use App\Models\Articulo;
use App\Models\Inventario;
use App\Models\Movimiento;
use App\Models\Supplier;
use App\Services\MovimientoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventarioController extends Controller
{
    public function __construct(private MovimientoService $movimientoService) {}
    public function index()
    {
        return Inertia::render('Inventarios/Index', [
            'inventarios' => Inventario::with(['articulo', 'supplier'])->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Inventarios/Create', [
            'articulos' => Articulo::all(),
            'suppliers' => Supplier::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cantidad' => 'required|integer|min:0',
            'lote' => 'nullable|integer',
            'vencimiento' => 'nullable|date',
            'articulo_id' => 'required|exists:articulos,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $inventario = Inventario::create($request->all());

        if ($inventario->cantidad > 0) {
            $this->movimientoService->registrar(
                $inventario,
                Movimiento::TIPO_ENTRADA_AJUSTE,
                $inventario->cantidad,
                null,
                null,
                'Stock inicial al crear inventario'
            );
        }

        return redirect()->route('inventarios.index')->with('success', 'Inventario creado exitosamente');
    }

    public function edit(Inventario $inventario)
    {
        return Inertia::render('Inventarios/Edit', [
            'inventario' => $inventario,
            'articulos' => Articulo::all(),
            'suppliers' => Supplier::all(),
        ]);
    }

    public function update(Request $request, Inventario $inventario)
    {
        $request->validate([
            'cantidad' => 'required|integer|min:0',
            'lote' => 'nullable|integer',
            'vencimiento' => 'nullable|date',
            'articulo_id' => 'required|exists:articulos,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $cantidadAnterior = $inventario->cantidad;
        $inventario->update($request->all());
        $diff = $inventario->cantidad - $cantidadAnterior;

        if ($diff > 0) {
            $this->movimientoService->registrar(
                $inventario,
                Movimiento::TIPO_ENTRADA_AJUSTE,
                $diff,
                null,
                null,
                'Ajuste manual de inventario (+' . $diff . ')'
            );
        } elseif ($diff < 0) {
            $this->movimientoService->registrar(
                $inventario,
                Movimiento::TIPO_SALIDA_AJUSTE,
                abs($diff),
                null,
                null,
                'Ajuste manual de inventario (' . $diff . ')'
            );
        }

        return redirect()->route('inventarios.index')->with('success', 'Inventario actualizado exitosamente');
    }

    public function destroy(Inventario $inventario)
    {
        $inventario->delete();

        return redirect()->route('inventarios.index')->with('success', 'Inventario eliminado exitosamente');
    }
}
