<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Stock;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ArticuloController extends Controller
{
    public function __construct(
        protected ImageService $imageService
    ) {}

    public function index(Request $request)
    {
        $query = Product::with(['category', 'brand', 'supplier']);

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('sku', 'like', '%' . $request->search . '%')
                  ->orWhere('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        return Inertia::render('Articulos/Index', [
            'articulos' => $query->paginate(5)->withQueryString(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Articulos/Create', [
            'categorias' => Category::all(),
            'marcas' => Brand::all(),
            'suppliers' => Supplier::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'sku' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'unit' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'tax_rate' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:0',
            'brand_id' => 'required|exists:brands,id',
            'category_id' => 'required|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'imagenes.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120'
        ]);

        $product = Product::create($request->except('imagenes'));

        if ($request->hasFile('imagenes')) {
            foreach ($request->file('imagenes') as $index => $imagen) {
                $resultado = $this->imageService->processProductImage($imagen, $product->id, $index);

                $product->images()->create([
                    'filename'       => $resultado['filename'],
                    'path'           => $resultado['path'],
                    'thumbnail_path' => $resultado['thumbnail_path'],
                    'is_primary'     => $index === 0,
                    'sort_order'     => $index,
                ]);
            }
        }

        return redirect()->route('articulos.index')->with('success', 'Artículo creado exitosamente');
    }

    public function show(Product $articulo)
    {
        return Inertia::render('Articulos/Show', [
            'articulo' => $articulo->load(['category', 'brand', 'supplier', 'images', 'stock'])
        ]);
    }

    public function edit(Product $articulo)
    {
        return Inertia::render('Articulos/Edit', [
            'articulo' => $articulo->load(['images', 'supplier']),
            'categorias' => Category::all(),
            'marcas' => Brand::all(),
            'suppliers' => Supplier::all(),
        ]);
    }

    public function update(Request $request, Product $articulo)
    {
        $request->validate([
            'sku' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'unit' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'tax_rate' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:0',
            'brand_id' => 'required|exists:brands,id',
            'category_id' => 'required|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'imagenes.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120'
        ]);

        $articulo->update($request->except('imagenes'));

        if ($request->hasFile('imagenes')) {
            $currentCount = $articulo->images()->count();

            foreach ($request->file('imagenes') as $index => $imagen) {
                $resultado = $this->imageService->processProductImage($imagen, $articulo->id, $currentCount + $index);

                $articulo->images()->create([
                    'filename'       => $resultado['filename'],
                    'path'           => $resultado['path'],
                    'thumbnail_path' => $resultado['thumbnail_path'],
                    'is_primary'     => $currentCount === 0 && $index === 0,
                    'sort_order'     => $currentCount + $index,
                ]);
            }
        }

        return redirect()->route('articulos.index')->with('success', 'Artículo actualizado exitosamente');
    }

    public function destroy(Product $articulo)
    {
        foreach ($articulo->images as $image) {
            $this->imageService->deleteProductImage($image->path, $image->thumbnail_path);
        }

        $articulo->delete();

        return redirect()->route('articulos.index')->with('success', 'Artículo eliminado exitosamente');
    }

    /**
     * Devuelve el stock disponible de un producto desglosado por almacén.
     * Usado por el POS y por el modal de "marcar entregada" para mostrar disponibilidad cross-warehouse.
     */
    public function stockByWarehouse(Request $request, Product $articulo)
    {
        $posWarehouseId = $request->integer('pos_warehouse_id') ?: null;

        $warehouses = Warehouse::active()
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get(['id', 'name']);

        $stocks = Stock::where('product_id', $articulo->id)
            ->pluck('quantity', 'warehouse_id');

        return response()->json(
            $warehouses->map(fn ($w) => [
                'warehouse_id'      => $w->id,
                'warehouse_name'    => $w->name,
                'quantity'          => (int) ($stocks[$w->id] ?? 0),
                'is_pos_warehouse'  => $posWarehouseId === $w->id,
            ])->values()
        );
    }
}
