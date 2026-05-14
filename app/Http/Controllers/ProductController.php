<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Services\ProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService
    ) {}

    public function index(Request $request): Response
    {
        $query = Product::with(['category', 'brand', 'supplier', 'primaryImage', 'stock']);

        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        if ($request->filled('category_id')) {
            $query->byCategory((int) $request->category_id);
        }

        if ($request->filled('brand_id')) {
            $query->byBrand((int) $request->brand_id);
        }

        if ($request->filled('supplier_id')) {
            $query->bySupplier((int) $request->supplier_id);
        }

        if ($request->filled('stock_status')) {
            match ($request->stock_status) {
                'low'  => $query->whereHas('stock', fn($q) => $q->whereColumn('quantity', '<=', 'products.min_stock')->where('quantity', '>', 0)),
                'none' => $query->where(fn($q) => $q->whereHas('stock', fn($s) => $s->where('quantity', 0))->orWhereDoesntHave('stock')),
                default => null,
            };
        }

        return Inertia::render('Products/Index', [
            'products'   => $query->orderBy('name')->paginate(15)->withQueryString(),
            'filters'    => $request->only(['search', 'active', 'category_id', 'brand_id', 'supplier_id', 'stock_status']),
            'categories' => Category::active()->orderBy('name')->get(['id', 'name']),
            'brands'     => Brand::active()->orderBy('name')->get(['id', 'name']),
            'suppliers'  => Supplier::orderBy('business_name')->get(['id', 'business_name']),
            'kpis'       => [
                'total'     => Product::count(),
                'active'    => Product::where('active', true)->count(),
                'low_stock' => Product::whereHas('stock', fn($q) => $q->whereColumn('quantity', '<=', 'products.min_stock')->where('quantity', '>', 0))->count(),
                'no_stock'  => Product::where(fn($q) => $q->whereHas('stock', fn($s) => $s->where('quantity', 0))->orWhereDoesntHave('stock'))->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Products/Create', [
            'categories' => Category::active()->orderBy('name')->get(['id', 'name']),
            'brands'     => Brand::active()->orderBy('name')->get(['id', 'name']),
            'suppliers'  => Supplier::orderBy('business_name')->get(['id', 'business_name']),
            'priceLists' => PriceList::where('active', true)->orderBy('name')->get(['id', 'name', 'percentage']),
            'warehouses' => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(['id', 'name', 'is_default']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->storeRules());

        $this->productService->create(
            Arr::except($validated, ['images']),
            $request->file('images', [])
        );

        return redirect()->route('products.index')
            ->with('success', 'Producto creado correctamente.');
    }

    public function show(Product $product): Response
    {
        $product->load(['category', 'brand', 'supplier', 'images', 'stock.movements' => function ($q) {
            $q->with('user')->orderBy('created_at', 'desc')->limit(20);
        }, 'priceLists']);

        return Inertia::render('Products/Show', [
            'product'    => $product,
            'movements'  => $product->stock?->movements ?? [],
        ]);
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('Products/Edit', [
            'product'    => $product->load(['images', 'supplier', 'priceLists']),
            'categories' => Category::active()->orderBy('name')->get(['id', 'name']),
            'brands'     => Brand::active()->orderBy('name')->get(['id', 'name']),
            'suppliers'  => Supplier::orderBy('business_name')->get(['id', 'business_name']),
            'priceLists' => PriceList::where('active', true)->orderBy('name')->get(['id', 'name', 'percentage']),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate($this->rules($product->id));

        $this->productService->update(
            $product,
            Arr::except($validated, ['images', 'sku']),
            $request->file('images', [])
        );

        return redirect()->route('products.show', $product)
            ->with('success', 'Producto actualizado correctamente.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Producto eliminado correctamente.');
    }

    public function toggleActive(Product $product): RedirectResponse
    {
        $this->productService->toggleActive($product);

        return back()->with('success', $product->active
            ? 'Producto activado.'
            : 'Producto desactivado.'
        );
    }

    public function stockByWarehouse(Request $request, Product $product)
    {
        $posWarehouseId = $request->integer('pos_warehouse_id') ?: null;

        $warehouses = Warehouse::where('active', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get(['id', 'name']);

        $stocks = Stock::where('product_id', $product->id)
            ->pluck('quantity', 'warehouse_id');

        return response()->json(
            $warehouses->map(fn ($w) => [
                'warehouse_id'     => $w->id,
                'warehouse_name'   => $w->name,
                'quantity'         => (int) ($stocks[$w->id] ?? 0),
                'is_pos_warehouse' => $posWarehouseId === $w->id,
            ])->values()
        );
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private function storeRules(): array
    {
        return array_merge($this->rules(), [
            'track_stock'         => 'boolean',
            'initial_stock'       => 'nullable|integer|min:0',
            'warehouse_id'        => 'nullable|exists:warehouses,id',
            'primary_image_index' => 'nullable|integer|min:0',
        ]);
    }

    private function rules(?int $productId = null): array
    {
        return [
            'sku'           => 'nullable|string|max:100|unique:products,sku' . ($productId ? ",{$productId}" : ''),
            'ean'           => 'nullable|string|max:14|unique:products,ean' . ($productId ? ",{$productId}" : ''),
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'unit'          => 'required|string|max:50',
            'price'         => 'required|numeric|min:0',
            'cost'          => 'nullable|numeric|min:0',
            'tax_rate'      => 'required|numeric|min:0',
            'min_stock'     => 'required|integer|min:0',
            'brand_id'      => 'nullable|exists:brands,id',
            'category_id'   => 'required|exists:categories,id',
            'supplier_id'   => 'nullable|exists:suppliers,id',
            'supplier_code' => 'nullable|string|max:100',
            'active'        => 'boolean',
            'published'     => 'boolean',
            'images.*'      => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ];
    }
}
