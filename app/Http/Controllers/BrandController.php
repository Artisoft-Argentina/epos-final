<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Services\BrandService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function __construct(
        private readonly BrandService $brandService
    ) {}

    public function index(Request $request): Response
    {
        $query = Brand::query();

        if ($request->search) {
            $query->search($request->search);
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        return Inertia::render('Brands/Index', [
            'brands'  => $query->orderBy('name')->paginate(15)->withQueryString(),
            'filters' => $request->only(['search', 'active']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $this->brandService->create($validated);

        return back()->with('success', 'Marca creada correctamente.');
    }

    public function update(Request $request, Brand $brand): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $this->brandService->update($brand, $validated);

        return back()->with('success', 'Marca actualizada correctamente.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        $brand->delete();

        return back()->with('success', 'Marca eliminada correctamente.');
    }

    public function toggleActive(Brand $brand): RedirectResponse
    {
        $this->brandService->toggleActive($brand);

        return back()->with('success', $brand->active ? 'Marca activada.' : 'Marca desactivada.');
    }

    private function rules(): array
    {
        return [
            'name'   => 'required|string|max:255',
            'active' => 'boolean',
        ];
    }
}
