<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PriceList extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'percentage',
        'pricing_strategy',
        'default_pos',
        'default_ecommerce',
        'active',
    ];

    protected $casts = [
        'percentage'        => 'decimal:2',
        'default_pos'       => 'boolean',
        'default_ecommerce' => 'boolean',
        'active'            => 'boolean',
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'price_list_products')
                    ->withPivot(['price', 'is_manual'])
                    ->withTimestamps();
    }
}
