<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarcaController extends Controller
{
    public function index()
    {
        return Inertia::render('Marcas/Index', [
            'marcas' => Brand::paginate(10),
        ]);
    }

    public function create()
    {
        return Inertia::render('Marcas/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        Brand::create($request->all());

        return redirect()->route('marcas.index')->with('success', 'Marca creada exitosamente');
    }

    public function edit(Brand $marca)
    {
        return Inertia::render('Marcas/Edit', [
            'marca' => $marca,
        ]);
    }

    public function update(Request $request, Brand $marca)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $marca->update($request->all());

        return redirect()->route('marcas.index')->with('success', 'Marca actualizada exitosamente');
    }

    public function destroy(Brand $marca)
    {
        $marca->delete();

        return redirect()->route('marcas.index')->with('success', 'Marca eliminada exitosamente');
    }
}
