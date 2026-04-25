<?php

namespace App\Http\Controllers;

use App\Models\PriceList;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ListaPrecioController extends Controller
{
    public function index()
    {
        return Inertia::render('ListasPrecios/Index', [
            'listas' => PriceList::orderBy('name')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('ListasPrecios/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'              => 'required|string|max:255',
            'percentage'        => 'required|numeric|min:0',
            'default_pos'       => 'nullable|boolean',
            'default_ecommerce' => 'nullable|boolean',
        ]);

        $validated['default_pos']       = $request->boolean('default_pos');
        $validated['default_ecommerce'] = $request->boolean('default_ecommerce');

        if ($validated['default_pos']) {
            PriceList::where('default_pos', true)->update(['default_pos' => false]);
        }
        if ($validated['default_ecommerce']) {
            PriceList::where('default_ecommerce', true)->update(['default_ecommerce' => false]);
        }

        $lista = PriceList::create($validated);
        $lista->generatePrices();

        return redirect()->route('listas-precios.index')->with('success', 'Lista de precios creada exitosamente');
    }

    public function show(PriceList $listas_precio)
    {
        $products = Product::with(['category', 'brand'])
            ->get()
            ->map(function ($product) use ($listas_precio) {
                $basePrice       = (float) ($product->price ?? 0);
                $calculatedPrice = $basePrice * (1 + ($listas_precio->percentage / 100));
                $currentEntry    = $product->priceLists()
                    ->where('price_list_id', $listas_precio->id)
                    ->first();

                return [
                    'id'               => $product->id,
                    'sku'              => $product->sku,
                    'name'             => $product->name,
                    'category'         => $product->category?->name,
                    'brand'            => $product->brand?->name,
                    'price_base'       => $basePrice,
                    'price_calculated' => round($calculatedPrice, 2),
                    'price_current'    => $currentEntry ? (float) $currentEntry->pivot->price : null,
                ];
            });

        return Inertia::render('ListasPrecios/Show', [
            'lista'     => $listas_precio,
            'articulos' => $products,
        ]);
    }

    public function edit(PriceList $listas_precio)
    {
        return Inertia::render('ListasPrecios/Edit', ['lista' => $listas_precio]);
    }

    public function update(Request $request, PriceList $listas_precio)
    {
        $validated = $request->validate([
            'name'              => 'required|string|max:255',
            'percentage'        => 'required|numeric|min:0',
            'default_pos'       => 'nullable|boolean',
            'default_ecommerce' => 'nullable|boolean',
        ]);

        $validated['default_pos']       = $request->boolean('default_pos');
        $validated['default_ecommerce'] = $request->boolean('default_ecommerce');

        if ($validated['default_pos']) {
            PriceList::where('id', '!=', $listas_precio->id)->where('default_pos', true)->update(['default_pos' => false]);
        }
        if ($validated['default_ecommerce']) {
            PriceList::where('id', '!=', $listas_precio->id)->where('default_ecommerce', true)->update(['default_ecommerce' => false]);
        }

        $previousPercentage = $listas_precio->percentage;
        $listas_precio->update($validated);

        if ($previousPercentage != $validated['percentage']) {
            $listas_precio->generatePrices();
        }

        return redirect()->route('listas-precios.index')->with('success', 'Lista de precios actualizada exitosamente');
    }

    public function destroy(PriceList $listas_precio)
    {
        $salesUsingList = Sale::where('price_list_id', $listas_precio->id)->count();

        if ($salesUsingList > 0) {
            return redirect()->route('listas-precios.index')
                ->with('error', 'No se puede eliminar la lista porque está siendo usada en ' . $salesUsingList . ' venta(s)');
        }

        $listas_precio->products()->detach();
        $listas_precio->delete();

        return redirect()->route('listas-precios.index')->with('success', 'Lista de precios eliminada exitosamente');
    }

    public function regenerarPrecios(PriceList $listas_precio)
    {
        $listas_precio->generatePrices();

        return redirect()->back()->with('success', 'Precios regenerados exitosamente');
    }
}
