<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CompraController extends Controller
{
    public function index()
    {
        return Inertia::render('Compras/Index', [
            'compras' => Purchase::with(['supplier', 'details'])->orderBy('date', 'desc')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Compras/Create', [
            'suppliers' => Supplier::all(),
            'articulos' => Product::with(['category', 'brand'])->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'order_number'                  => 'required|string|max:255',
            'date'                          => 'required|date',
            'supplier_id'                   => 'required|exists:suppliers,id',
            'notes'                         => 'nullable|string',
            'detalles'                      => 'required|array|min:1',
            'detalles.*.articulo_id'        => 'required|exists:products,id',
            'detalles.*.cantidad'           => 'required|integer|min:1',
            'detalles.*.precio_unitario'    => 'required|numeric|min:0',
        ]);

        $purchase = Purchase::create([
            'order_number' => $request->order_number,
            'date'         => $request->date,
            'supplier_id'  => $request->supplier_id,
            'notes'        => $request->notes,
            'subtotal'     => 0,
            'total'        => 0,
        ]);

        $subtotal = 0;
        foreach ($request->detalles as $detalle) {
            $itemSubtotal = $detalle['cantidad'] * $detalle['precio_unitario'];
            $purchase->details()->create([
                'product_id' => $detalle['articulo_id'],
                'quantity'   => $detalle['cantidad'],
                'unit_price' => $detalle['precio_unitario'],
                'subtotal'   => $itemSubtotal,
            ]);
            $subtotal += $itemSubtotal;
        }

        $purchase->update(['subtotal' => $subtotal, 'total' => $subtotal]);

        return redirect()->route('compras.index')->with('success', 'Compra registrada exitosamente');
    }

    public function show(Purchase $compra)
    {
        return Inertia::render('Compras/Show', [
            'compra' => $compra->load(['supplier', 'details.product']),
        ]);
    }

    public function edit(Purchase $compra)
    {
        return Inertia::render('Compras/Edit', [
            'compra'    => $compra->load(['supplier', 'details.product']),
            'suppliers' => Supplier::all(),
            'articulos' => Product::with(['category', 'brand'])->get(),
        ]);
    }

    public function update(Request $request, Purchase $compra)
    {
        $request->validate([
            'order_number'                  => 'required|string|max:255',
            'date'                          => 'required|date',
            'supplier_id'                   => 'required|exists:suppliers,id',
            'notes'                         => 'nullable|string',
            'detalles'                      => 'required|array|min:1',
            'detalles.*.articulo_id'        => 'required|exists:products,id',
            'detalles.*.cantidad'           => 'required|integer|min:1',
            'detalles.*.precio_unitario'    => 'required|numeric|min:0',
        ]);

        $compra->update([
            'order_number' => $request->order_number,
            'date'         => $request->date,
            'supplier_id'  => $request->supplier_id,
            'notes'        => $request->notes,
        ]);

        $compra->details()->delete();

        $subtotal = 0;
        foreach ($request->detalles as $detalle) {
            $itemSubtotal = $detalle['cantidad'] * $detalle['precio_unitario'];
            $compra->details()->create([
                'product_id' => $detalle['articulo_id'],
                'quantity'   => $detalle['cantidad'],
                'unit_price' => $detalle['precio_unitario'],
                'subtotal'   => $itemSubtotal,
            ]);
            $subtotal += $itemSubtotal;
        }

        $compra->update(['subtotal' => $subtotal, 'total' => $subtotal]);

        return redirect()->route('compras.index')->with('success', 'Compra actualizada exitosamente');
    }

    public function destroy(Purchase $compra)
    {
        $compra->delete();

        return redirect()->route('compras.index')->with('success', 'Compra eliminada exitosamente');
    }
}
