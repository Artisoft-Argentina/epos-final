<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryService $categoryService
    ) {}

    public function index(Request $request): Response
    {
        $query = Category::query();

        if ($request->search) {
            $query->search($request->search);
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        return Inertia::render('Categories/Index', [
            'categories' => $query->orderBy('name')->paginate(15)->withQueryString(),
            'filters'    => $request->only(['search', 'active']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $this->categoryService->create($validated);

        return back()->with('success', 'Categoría creada correctamente.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $this->categoryService->update($category, $validated);

        return back()->with('success', 'Categoría actualizada correctamente.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->delete();

        return back()->with('success', 'Categoría eliminada correctamente.');
    }

    public function toggleActive(Category $category): RedirectResponse
    {
        $this->categoryService->toggleActive($category);

        return back()->with('success', $category->active ? 'Categoría activada.' : 'Categoría desactivada.');
    }

    private function rules(): array
    {
        return [
            'name'   => 'required|string|max:255',
            'active' => 'boolean',
        ];
    }
}
