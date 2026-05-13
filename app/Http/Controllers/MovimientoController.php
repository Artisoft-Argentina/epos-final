<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use Inertia\Inertia;

class MovimientoController extends Controller
{
    /**
     * Muestra el historial de movimientos de stock de un producto.
     */
    public function index(Product $product)
    {
        $stock = Stock::where('product_id', $product->id)->first();

        $calculatedQuantity = 0;

        if ($stock) {
            $movements = $stock->movements()
                ->with(['user', 'referenceable'])
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            $calculatedQuantity = $stock->calculatedQuantity();
        } else {
            $movements = StockMovement::whereNull('id')->paginate(20);
        }

        $from = request('from', 'products'); // 'products' | 'inventarios'

        return Inertia::render('Inventarios/Movimientos', [
            'articulo'       => $product->load(['category', 'brand']),
            'inventario'     => $stock,
            'movimientos'    => $movements,
            'stockCalculado' => $calculatedQuantity,
            'tipos'          => StockMovement::TYPES,
            'backUrl'        => $from === 'inventarios' ? route('inventarios.index') : route('products.index'),
            'backLabel'      => $from === 'inventarios' ? 'Inventarios' : 'Productos',
        ]);
    }
}
