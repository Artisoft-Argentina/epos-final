<?php

namespace App\Http\Controllers;

use App\Models\PointOfSale;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PointOfSaleController extends Controller
{
    public function index()
    {
        return Inertia::render('PuntosVenta/Index', [
            'puntosVenta' => PointOfSale::with('warehouse')
                ->orderBy('is_default', 'desc')
                ->orderBy('pos_number')
                ->paginate(10),
        ]);
    }

    public function create()
    {
        return Inertia::render('PuntosVenta/Create', [
            'warehouses' => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'                    => 'required|string|max:255',
            'pos_number'              => ['required', 'integer', 'min:1', 'max:99999', Rule::unique('points_of_sale', 'pos_number')],
            'warehouse_id'            => 'required|exists:warehouses,id',
            'voucher_letter_default'  => 'required|in:A,B,C',
            'next_invoice_number_a'   => 'nullable|integer|min:1',
            'next_invoice_number_b'   => 'nullable|integer|min:1',
            'next_invoice_number_c'   => 'nullable|integer|min:1',
            'is_default'              => 'boolean',
            'active'                  => 'boolean',
        ]);

        $data['next_invoice_number_a'] = $data['next_invoice_number_a'] ?? 1;
        $data['next_invoice_number_b'] = $data['next_invoice_number_b'] ?? 1;
        $data['next_invoice_number_c'] = $data['next_invoice_number_c'] ?? 1;

        PointOfSale::create($data);

        return redirect()->route('puntos-venta.index')->with('success', 'Punto de venta creado exitosamente');
    }

    public function edit(PointOfSale $puntoVenta)
    {
        return Inertia::render('PuntosVenta/Edit', [
            'puntoVenta' => $puntoVenta,
            'warehouses' => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, PointOfSale $puntoVenta)
    {
        $data = $request->validate([
            'name'                    => 'required|string|max:255',
            'pos_number'              => ['required', 'integer', 'min:1', 'max:99999', Rule::unique('points_of_sale', 'pos_number')->ignore($puntoVenta->id)],
            'warehouse_id'            => 'required|exists:warehouses,id',
            'voucher_letter_default'  => 'required|in:A,B,C',
            'next_invoice_number_a'   => 'nullable|integer|min:1',
            'next_invoice_number_b'   => 'nullable|integer|min:1',
            'next_invoice_number_c'   => 'nullable|integer|min:1',
            'is_default'              => 'boolean',
            'active'                  => 'boolean',
        ]);

        $puntoVenta->update($data);

        return redirect()->route('puntos-venta.index')->with('success', 'Punto de venta actualizado exitosamente');
    }

    public function destroy(PointOfSale $puntoVenta)
    {
        if ($puntoVenta->is_default) {
            return back()->with('error', 'No se puede eliminar el punto de venta por defecto. Asigná otro como default antes.');
        }

        if ($puntoVenta->sales()->exists()) {
            return back()->with('error', 'No se puede eliminar un punto de venta con ventas asociadas.');
        }

        $puntoVenta->delete();

        return redirect()->route('puntos-venta.index')->with('success', 'Punto de venta eliminado exitosamente');
    }

    public function setActive(Request $request)
    {
        $request->validate(['point_of_sale_id' => 'required|exists:points_of_sale,id']);
        session(['active_point_of_sale_id' => (int) $request->input('point_of_sale_id')]);
        return back()->with('success', 'Punto de venta activo actualizado.');
    }
}
