<?php

namespace App\Http\Controllers;

use App\Models\ListaPrecio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ListaPrecioController extends Controller
{
    public function index()
    {
        return Inertia::render('ListasPrecios/Index', [
            'listas' => ListaPrecio::orderBy('nombre')->get()
        ]);
    }

    public function create()
    {
        return Inertia::render('ListasPrecios/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'porcentaje' => 'required|numeric|min:0',
            'default_pos' => 'nullable|boolean',
            'default_ecommerce' => 'nullable|boolean'
        ]);

        $validated['default_pos'] = $request->boolean('default_pos');
        $validated['default_ecommerce'] = $request->boolean('default_ecommerce');

        if ($validated['default_pos']) {
            ListaPrecio::where('default_pos', true)->update(['default_pos' => false]);
        }

        if ($validated['default_ecommerce']) {
            ListaPrecio::where('default_ecommerce', true)->update(['default_ecommerce' => false]);
        }

        $lista = ListaPrecio::create($validated);
        $lista->generarPrecios();

        return redirect()->route('listas-precios.index')
                        ->with('success', 'Lista de precios creada exitosamente');
    }

    public function show(ListaPrecio $listas_precio)
    {
        $articulos = \App\Models\Articulo::with(['categoria', 'marca'])
            ->get()
            ->map(function ($articulo) use ($listas_precio) {
                $precioBase = (float) ($articulo->precio ?? 0);
                $precioCalculado = $precioBase * (1 + ($listas_precio->porcentaje / 100));
                
                // Obtener precio actual si existe
                $precioActual = $articulo->listasPrecios()
                    ->where('lista_precio_id', $listas_precio->id)
                    ->first();
                
                return [
                    'id' => $articulo->id,
                    'codarticulo' => $articulo->codarticulo,
                    'articulo' => $articulo->articulo,
                    'categoria' => $articulo->categoria?->nombre,
                    'marca' => $articulo->marca?->nombre,
                    'precio_base' => (float) $precioBase,
                    'precio_calculado' => (float) round($precioCalculado, 2),
                    'precio_actual' => $precioActual ? (float) $precioActual->pivot->precio : null,
                ];
            });

        return Inertia::render('ListasPrecios/Show', [
            'lista' => $listas_precio,
            'articulos' => $articulos
        ]);
    }

    public function edit(ListaPrecio $listas_precio)
    {
        return Inertia::render('ListasPrecios/Edit', [
            'lista' => $listas_precio
        ]);
    }

    public function update(Request $request, ListaPrecio $listas_precio)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'porcentaje' => 'required|numeric|min:0',
            'default_pos' => 'nullable|boolean',
            'default_ecommerce' => 'nullable|boolean'
        ]);

        $validated['default_pos'] = $request->boolean('default_pos');
        $validated['default_ecommerce'] = $request->boolean('default_ecommerce');

        if ($validated['default_pos']) {
            ListaPrecio::where('id', '!=', $listas_precio->id)
                      ->where('default_pos', true)
                      ->update(['default_pos' => false]);
        }

        if ($validated['default_ecommerce']) {
            ListaPrecio::where('id', '!=', $listas_precio->id)
                      ->where('default_ecommerce', true)
                      ->update(['default_ecommerce' => false]);
        }

        $porcentajeAnterior = $listas_precio->porcentaje;
        $listas_precio->update($validated);

        if ($porcentajeAnterior != $validated['porcentaje']) {
            $listas_precio->generarPrecios();
        }

        return redirect()->route('listas-precios.index')
                        ->with('success', 'Lista de precios actualizada exitosamente');
    }

    public function destroy(ListaPrecio $listas_precio)
    {
        $ventasUsandoLista = \App\Models\Factura::where('lista_precio_id', $listas_precio->id)->count();
        
        if ($ventasUsandoLista > 0) {
            return redirect()->route('listas-precios.index')
                            ->with('error', 'No se puede eliminar la lista porque está siendo usada en ' . $ventasUsandoLista . ' venta(s)');
        }

        $listas_precio->articulos()->detach();
        $listas_precio->delete();

        return redirect()->route('listas-precios.index')
                        ->with('success', 'Lista de precios eliminada exitosamente');
    }

    public function regenerarPrecios(ListaPrecio $listas_precio)
    {
        $listas_precio->generarPrecios();
        
        return redirect()->back()
                        ->with('success', 'Precios regenerados exitosamente');
    }
}