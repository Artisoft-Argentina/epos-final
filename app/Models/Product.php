<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'supplier_code',
        'sku',
        'ean',
        'name',
        'description',
        'unit',
        'cost',
        'markup_percent',
        'tax_rate',
        'min_stock',
        'brand_id',
        'category_id',
        'supplier_id',
        'barcode',
        'qr_code',
        'active',
        'published',
    ];

    protected $casts = [
        'cost'           => 'decimal:2',
        'markup_percent' => 'decimal:2',
        'tax_rate'       => 'decimal:2',
        'active'         => 'boolean',
        'published'      => 'boolean',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function (Builder $q) use ($term) {
            $q->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($term) . '%'])
              ->orWhereRaw('LOWER(sku) LIKE ?', ['%' . strtolower($term) . '%'])
              ->orWhereRaw('LOWER(ean) LIKE ?', ['%' . strtolower($term) . '%']);
        });
    }

    public function scopeByCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByBrand(Builder $query, int $brandId): Builder
    {
        return $query->where('brand_id', $brandId);
    }

    public function scopeBySupplier(Builder $query, int $supplierId): Builder
    {
        return $query->where('supplier_id', $supplierId);
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function priceLists(): BelongsToMany
    {
        return $this->belongsToMany(PriceList::class, 'price_list_products')
                    ->withPivot(['price', 'is_manual'])
                    ->withTimestamps();
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function stock(): HasOne
    {
        return $this->hasOne(Stock::class);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getSalePriceAttribute(): float
    {
        $list = $this->priceLists()->where('default_pos', true)->first()
             ?? $this->priceLists()->first();

        return $list ? (float) $list->pivot->price : 0.0;
    }

    /**
     * Código a usar para generar el barcode:
     * EAN/GTIN si existe, sino SKU interno.
     */
    public function getBarcodeValueAttribute(): string
    {
        return $this->ean ?? $this->sku;
    }
}
