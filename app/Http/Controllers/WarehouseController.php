<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    public function index()
    {
        return Inertia::render('Almacenes/Index', [
            'warehouses' => Warehouse::orderBy('is_default', 'desc')->orderBy('name')->paginate(10),
        ]);
    }

    public function create()
    {
        return Inertia::render('Almacenes/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'       => 'required|string|max:255',
            'code'       => ['required', 'string', 'max:50', Rule::unique('warehouses', 'code')],
            'address'    => 'nullable|string|max:255',
            'phone'      => 'nullable|string|max:50',
            'notes'      => 'nullable|string',
            'is_default' => 'boolean',
            'active'     => 'boolean',
        ]);

        Warehouse::create($data);

        return redirect()->route('almacenes.index')->with('success', 'Almacén creado exitosamente');
    }

    public function edit(Warehouse $almacen)
    {
        return Inertia::render('Almacenes/Edit', [
            'warehouse' => $almacen,
        ]);
    }

    public function update(Request $request, Warehouse $almacen)
    {
        $data = $request->validate([
            'name'       => 'required|string|max:255',
            'code'       => ['required', 'string', 'max:50', Rule::unique('warehouses', 'code')->ignore($almacen->id)],
            'address'    => 'nullable|string|max:255',
            'phone'      => 'nullable|string|max:50',
            'notes'      => 'nullable|string',
            'is_default' => 'boolean',
            'active'     => 'boolean',
        ]);

        $almacen->update($data);

        return redirect()->route('almacenes.index')->with('success', 'Almacén actualizado exitosamente');
    }

    public function destroy(Warehouse $almacen)
    {
        if ($almacen->is_default) {
            return back()->with('error', 'No se puede eliminar el almacén por defecto. Asigná otro como default antes.');
        }

        if ($almacen->stocks()->exists()) {
            return back()->with('error', 'No se puede eliminar un almacén con stock asociado.');
        }

        $almacen->delete();

        return redirect()->route('almacenes.index')->with('success', 'Almacén eliminado exitosamente');
    }
}
