<?php

namespace App\Http\Controllers;

use App\Models\Articulo;
use App\Models\Inventario;
use App\Models\Movimiento;
use Inertia\Inertia;

class MovimientoController extends Controller
{
    /**
     * Muestra el historial de movimientos de stock de un artículo.
     */
    public function index(Articulo $articulo)
    {
        $inventario = Inventario::where('articulo_id', $articulo->id)->first();

        $movimientos = collect();
        $stockCalculado = 0;

        if ($inventario) {
            $movimientos = $inventario->movimientos()
                ->with(['user', 'referenciable'])
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            $stockCalculado = $inventario->stockCalculado();
        }

        return Inertia::render('Inventarios/Movimientos', [
            'articulo'       => $articulo->load(['categoria', 'marca']),
            'inventario'     => $inventario,
            'movimientos'    => $movimientos,
            'stockCalculado' => $stockCalculado,
            'tipos'          => Movimiento::TIPOS,
        ]);
    }
}
