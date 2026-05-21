<?php

namespace App\Services;

use App\Models\Brand;

class BrandService
{
    public function create(array $data): Brand
    {
        return Brand::create($data);
    }

    public function update(Brand $brand, array $data): void
    {
        $brand->update($data);
    }

    public function toggleActive(Brand $brand): void
    {
        $brand->update(['active' => ! $brand->active]);
    }
}
