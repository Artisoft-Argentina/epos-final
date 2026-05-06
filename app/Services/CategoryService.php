<?php

namespace App\Services;

use App\Models\Category;

class CategoryService
{
    public function create(array $data): Category
    {
        return Category::create($data);
    }

    public function update(Category $category, array $data): void
    {
        $category->update($data);
    }

    public function toggleActive(Category $category): void
    {
        $category->update(['active' => ! $category->active]);
    }
}
