<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
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
        $query = Product::with(['category', 'brand', 'supplier', 'primaryImage']);

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

        return Inertia::render('Products/Index', [
            'products'   => $query->orderBy('name')->paginate(15)->withQueryString(),
            'filters'    => $request->only(['search', 'active', 'category_id', 'brand_id', 'supplier_id']),
            'categories' => Category::active()->orderBy('name')->get(['id', 'name']),
            'brands'     => Brand::active()->orderBy('name')->get(['id', 'name']),
            'suppliers'  => Supplier::orderBy('business_name')->get(['id', 'business_name']),
            'kpis'       => [
                'total'  => Product::count(),
                'active' => Product::where('active', true)->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Products/Create', [
            'categories' => Category::active()->orderBy('name')->get(['id', 'name']),
            'brands'     => Brand::active()->orderBy('name')->get(['id', 'name']),
            'suppliers'  => Supplier::orderBy('business_name')->get(['id', 'business_name']),
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
        return Inertia::render('Products/Show', [
            'product' => $product->load(['category', 'brand', 'supplier', 'images', 'stock']),
        ]);
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('Products/Edit', [
            'product'    => $product->load(['images', 'supplier']),
            'categories' => Category::active()->orderBy('name')->get(['id', 'name']),
            'brands'     => Brand::active()->orderBy('name')->get(['id', 'name']),
            'suppliers'  => Supplier::orderBy('business_name')->get(['id', 'business_name']),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate($this->rules($product->id));

        $this->productService->update(
            $product,
            Arr::except($validated, ['images']),
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

    public function generateSku(): \Illuminate\Http\JsonResponse
    {
        return response()->json(['sku' => $this->productService->generateSku()]);
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private function storeRules(): array
    {
        return array_merge($this->rules(), [
            'initial_stock' => 'nullable|integer|min:0',
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
            'brand_id'      => 'required|exists:brands,id',
            'category_id'   => 'required|exists:categories,id',
            'supplier_id'   => 'nullable|exists:suppliers,id',
            'supplier_code' => 'nullable|string|max:100',
            'active'        => 'boolean',
            'published'     => 'boolean',
            'images.*'      => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ];
    }
}
