<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'supplier_code',
        'sku',
        'name',
        'description',
        'unit',
        'price',
        'tax_rate',
        'min_stock',
        'brand_id',
        'category_id',
        'supplier_id',
        'barcode',
        'qr_code',
        'active',
    ];

    protected $casts = [
        'price'    => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'active'   => 'boolean',
    ];

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function priceLists()
    {
        return $this->belongsToMany(PriceList::class, 'price_list_products')
                    ->withPivot('price')
                    ->withTimestamps();
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function stock()
    {
        return $this->hasOne(Stock::class);
    }

    public function getSalePriceAttribute()
    {
        $list = $this->priceLists()->wherePivot('price', '>', 0)->first();
        return $list ? $list->pivot->price : ($this->price ?? 0);
    }
}
