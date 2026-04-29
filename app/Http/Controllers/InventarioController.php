<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Services\MovimientoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventarioController extends Controller
{
    public function __construct(private MovimientoService $movimientoService) {}

    public function index()
    {
        $inventarios = Stock::with('product')->get()->map(function ($stock) {
            $stock->calculated_quantity = $stock->calculatedQuantity();
            return $stock;
        });

        return Inertia::render('Inventarios/Index', [
            'inventarios' => $inventarios,
        ]);
    }

    public function create()
    {
        return Inertia::render('Inventarios/Create', [
            'articulos' => Product::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'quantity'   => 'required|integer|min:0',
            'product_id' => 'required|exists:products,id',
        ]);

        // Crear stock con quantity 0 — el servicio aplica el increment
        $stock = Stock::create([
            'product_id' => $request->product_id,
            'quantity'   => 0,
        ]);

        if ($request->quantity > 0) {
            $this->movimientoService->registrar(
                $stock,
                StockMovement::TYPE_ADJUSTMENT_ENTRY,
                $request->quantity,
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
        ]);
    }

    public function update(Request $request, Stock $inventario)
    {
        $request->validate([
            'quantity'   => 'required|integer|min:0',
            'product_id' => 'required|exists:products,id',
        ]);

        $inventario->update(['product_id' => $request->product_id]);

        // quantity solo se toca via movimiento
        $diff = $request->quantity - $inventario->quantity;

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

    public function adjust(Request $request, Stock $inventario)
    {
        $request->validate([
            'quantity' => 'required|integer|not_in:0',
            'reason'   => 'required|string|max:255',
        ]);

        $quantity = (int) $request->quantity;

        if ($quantity > 0) {
            $this->movimientoService->registrar(
                $inventario, StockMovement::TYPE_ADJUSTMENT_ENTRY,
                $quantity, null, null, $request->reason
            );
        } else {
            if ($inventario->quantity < abs($quantity)) {
                return back()->with('error', 'Stock insuficiente para realizar el ajuste.');
            }
            $this->movimientoService->registrar(
                $inventario, StockMovement::TYPE_ADJUSTMENT_EXIT,
                abs($quantity), null, null, $request->reason
            );
        }

        return back()->with('success', "Ajuste aplicado a '{$inventario->product->name}' exitosamente.");
    }

    public function reconcile(Stock $inventario)
    {
        $diff = $inventario->reconciliationDiff();

        if ($diff === 0) {
            return back()->with('info', 'El inventario ya está conciliado.');
        }

        if ($diff > 0) {
            // Faltan unidades en la columna materializada
            $this->movimientoService->registrar(
                $inventario, StockMovement::TYPE_RECONCILIATION_ENTRY,
                $diff, null, null, 'Conciliación: ajuste positivo de ' . $diff . ' unidades'
            );
        } else {
            // Sobran unidades en la columna materializada
            $this->movimientoService->registrar(
                $inventario, StockMovement::TYPE_RECONCILIATION_EXIT,
                abs($diff), null, null, 'Conciliación: ajuste negativo de ' . abs($diff) . ' unidades'
            );
        }

        return back()->with('success', "Inventario de '{$inventario->product->name}' conciliado exitosamente.");
    }

    public function reconcileAll()
    {
        $stocks = Stock::with(['product', 'movements'])->get();
        $conciliados = 0;

        foreach ($stocks as $stock) {
            if (! $stock->needsReconciliation()) {
                continue;
            }

            $diff = $stock->reconciliationDiff();

            if ($diff > 0) {
                $this->movimientoService->registrar(
                    $stock, StockMovement::TYPE_RECONCILIATION_ENTRY,
                    $diff, null, null, 'Conciliación masiva: ajuste positivo de ' . $diff . ' unidades'
                );
            } else {
                $this->movimientoService->registrar(
                    $stock, StockMovement::TYPE_RECONCILIATION_EXIT,
                    abs($diff), null, null, 'Conciliación masiva: ajuste negativo de ' . abs($diff) . ' unidades'
                );
            }

            $conciliados++;
        }

        return back()->with('success', "Se conciliaron {$conciliados} inventario(s) exitosamente.");
    }
}
