<?php

namespace App\Http\Controllers;

use App\Models\PriceList;
use App\Models\Product;
use App\Models\Sale;
use App\Services\PriceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PriceListController extends Controller
{
    public function __construct(
        private readonly PriceService $priceService
    ) {}

    public function index()
    {
        return Inertia::render('PriceLists/Index', [
            'priceLists' => PriceList::orderBy('name')->paginate(15),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());

        $validated['default_pos']       = $request->boolean('default_pos');
        $validated['default_ecommerce'] = $request->boolean('default_ecommerce');

        DB::transaction(function () use ($validated, $request) {
            if ($validated['default_pos']) {
                PriceList::where('default_pos', true)->update(['default_pos' => false]);
            }
            if ($validated['default_ecommerce']) {
                PriceList::where('default_ecommerce', true)->update(['default_ecommerce' => false]);
            }

            $priceList = PriceList::create($validated);
            $this->priceService->recalculateList($priceList, 'all', $request->user());
        });

        return redirect()->route('price-lists.index')->with('success', 'Lista de precios creada correctamente.');
    }

    public function show(Request $request, PriceList $priceList)
    {
        $query = Product::where('active', true)
            ->with(['category:id,name', 'brand:id,name']);

        if ($request->filled('search')) {
            $query->search($request->search);
        }

        $products = $query->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(function ($product) use ($priceList) {
                $pivot = $product->priceLists()
                    ->where('price_list_id', $priceList->id)
                    ->first();

                $price = $pivot ? (float) $pivot->pivot->price : 0.0;
                $cost  = (float) $product->cost;

                return [
                    'id'             => $product->id,
                    'sku'            => $product->sku,
                    'name'           => $product->name,
                    'category'       => $product->category?->name,
                    'brand'          => $product->brand?->name,
                    'cost'           => $cost,
                    'price'          => $price,
                    'is_manual'      => $pivot ? (bool) $pivot->pivot->is_manual : false,
                    'margin_percent' => $cost > 0 ? round(($price - $cost) / $cost * 100, 2) : 0,
                ];
            });

        return Inertia::render('PriceLists/Show', [
            'priceList' => $priceList,
            'products'  => $products,
            'filters'   => $request->only(['search']),
        ]);
    }

    public function update(Request $request, PriceList $priceList)
    {
        $validated = $request->validate($this->rules());

        $validated['default_pos']       = $request->boolean('default_pos');
        $validated['default_ecommerce'] = $request->boolean('default_ecommerce');

        $previousPercentage = (float) $priceList->percentage;

        DB::transaction(function () use ($request, $priceList, $validated, $previousPercentage) {
            if ($validated['default_pos']) {
                PriceList::where('id', '!=', $priceList->id)->where('default_pos', true)->update(['default_pos' => false]);
            }
            if ($validated['default_ecommerce']) {
                PriceList::where('id', '!=', $priceList->id)->where('default_ecommerce', true)->update(['default_ecommerce' => false]);
            }

            $priceList->update($validated);

            // Recalcular si cambió el porcentaje o la estrategia (respetando manuales)
            $percentageChanged = abs((float) $validated['percentage'] - $previousPercentage) >= 0.005;
            if ($percentageChanged || $priceList->wasChanged('pricing_strategy')) {
                $this->priceService->recalculateList($priceList->fresh(), 'auto_only', $request->user());
            }
        });

        return redirect()->route('price-lists.index')->with('success', 'Lista de precios actualizada correctamente.');
    }

    public function destroy(PriceList $priceList)
    {
        $salesCount = Sale::where('price_list_id', $priceList->id)->count();

        if ($salesCount > 0) {
            return redirect()->route('price-lists.index')
                ->with('error', "No se puede eliminar la lista porque está asociada a {$salesCount} venta(s).");
        }

        // No permitir eliminar la última lista activa
        if ($priceList->active && PriceList::where('active', true)->count() <= 1) {
            return redirect()->route('price-lists.index')
                ->with('error', 'No se puede eliminar la última lista activa.');
        }

        // Debe existir siempre una lista POS por defecto (R1)
        if ($priceList->default_pos) {
            return redirect()->route('price-lists.index')
                ->with('error', 'No se puede eliminar la lista POS por defecto. Asigná otra lista como predeterminada antes de eliminarla.');
        }

        $priceList->products()->detach();
        $priceList->delete();

        return redirect()->route('price-lists.index')->with('success', 'Lista de precios eliminada correctamente.');
    }

    public function recalculate(Request $request, PriceList $priceList)
    {
        $request->validate([
            'strategy' => 'required|in:all,auto_only',
        ]);

        $this->priceService->recalculateList($priceList, $request->strategy, $request->user());

        return back()->with('success', 'Precios recalculados correctamente.');
    }

    public function overridePrice(Request $request, PriceList $priceList)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'price'      => 'required|numeric|min:0',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $this->priceService->overridePrice($product, $priceList, (float) $validated['price'], $request->user());

        return back()->with('success', 'Precio actualizado correctamente.');
    }

    private function rules(): array
    {
        return [
            'name'              => 'required|string|max:255',
            'percentage'        => 'required|numeric',
            'pricing_strategy'  => 'required|in:list,product',
            'default_pos'       => 'nullable|boolean',
            'default_ecommerce' => 'nullable|boolean',
        ];
    }
}
