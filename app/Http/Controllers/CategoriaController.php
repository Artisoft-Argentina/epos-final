<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoriaController extends Controller
{
    public function index()
    {
        return Inertia::render('Categorias/Index', [
            'categorias' => Category::paginate(10),
        ]);
    }

    public function create()
    {
        return Inertia::render('Categorias/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        Category::create($request->all());

        return redirect()->route('categorias.index')->with('success', 'Categoría creada exitosamente');
    }

    public function edit(Category $categoria)
    {
        return Inertia::render('Categorias/Edit', [
            'categoria' => $categoria,
        ]);
    }

    public function update(Request $request, Category $categoria)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $categoria->update($request->all());

        return redirect()->route('categorias.index')->with('success', 'Categoría actualizada exitosamente');
    }

    public function destroy(Category $categoria)
    {
        $categoria->delete();

        return redirect()->route('categorias.index')->with('success', 'Categoría eliminada exitosamente');
    }
}
