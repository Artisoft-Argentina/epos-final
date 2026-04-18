<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
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
            'inventarios' => Stock::with(['product', 'supplier'])->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Inventarios/Create', [
            'articulos' => Product::all(),
            'suppliers' => Supplier::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'quantity'        => 'required|integer|min:0',
            'batch'           => 'nullable|integer',
            'expiration_date' => 'nullable|date',
            'product_id'      => 'required|exists:products,id',
            'supplier_id'     => 'nullable|exists:suppliers,id',
        ]);

        $stock = Stock::create($request->all());

        if ($stock->quantity > 0) {
            $this->movimientoService->registrar(
                $stock,
                StockMovement::TYPE_ADJUSTMENT_ENTRY,
                $stock->quantity,
                null, null,
                'Stock inicial al crear inventario'
            );
        }

        return redirect()->route('inventarios.index')->with('success', 'Inventario creado exitosamente');
    }

    public function edit(Stock $inventario)
    {
        return Inertia::render('Inventarios/Edit', [
            'inventario' => $inventario,
            'articulos'  => Product::all(),
            'suppliers'  => Supplier::all(),
        ]);
    }

    public function update(Request $request, Stock $inventario)
    {
        $request->validate([
            'quantity'        => 'required|integer|min:0',
            'batch'           => 'nullable|integer',
            'expiration_date' => 'nullable|date',
            'product_id'      => 'required|exists:products,id',
            'supplier_id'     => 'nullable|exists:suppliers,id',
        ]);

        $previousQuantity = $inventario->quantity;
        $inventario->update($request->all());
        $diff = $inventario->quantity - $previousQuantity;

        if ($diff > 0) {
            $this->movimientoService->registrar(
                $inventario, StockMovement::TYPE_ADJUSTMENT_ENTRY,
                $diff, null, null, 'Ajuste manual de inventario (+' . $diff . ')'
            );
        } elseif ($diff < 0) {
            $this->movimientoService->registrar(
                $inventario, StockMovement::TYPE_ADJUSTMENT_EXIT,
                abs($diff), null, null, 'Ajuste manual de inventario (' . $diff . ')'
            );
        }

        return redirect()->route('inventarios.index')->with('success', 'Inventario actualizado exitosamente');
    }

    public function destroy(Stock $inventario)
    {
        $inventario->delete();

        return redirect()->route('inventarios.index')->with('success', 'Inventario eliminado exitosamente');
    }
}
