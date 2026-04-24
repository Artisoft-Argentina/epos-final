<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stock extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'quantity',
        'product_id',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function calculatedQuantity(): int
    {
        $entries = $this->movements()->whereIn('type', StockMovement::ENTRY_TYPES)->sum('quantity');
        $exits   = $this->movements()->whereIn('type', StockMovement::EXIT_TYPES)->sum('quantity');
        return (int) ($entries - $exits);
    }
}
