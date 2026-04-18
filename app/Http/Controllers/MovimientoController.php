<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use Inertia\Inertia;

class MovimientoController extends Controller
{
    /**
     * Muestra el historial de movimientos de stock de un artículo.
     */
    public function index(Product $articulo)
    {
        $stock = Stock::where('product_id', $articulo->id)->first();

        $movements = collect();
        $calculatedQuantity = 0;

        if ($stock) {
            $movements = $stock->movements()
                ->with(['user', 'referenceable'])
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            $calculatedQuantity = $stock->calculatedQuantity();
        }

        return Inertia::render('Inventarios/Movimientos', [
            'articulo'       => $articulo->load(['category', 'brand']),
            'inventario'     => $stock,
            'movimientos'    => $movements,
            'stockCalculado' => $calculatedQuantity,
            'tipos'          => StockMovement::TYPES,
        ]);
    }
}
