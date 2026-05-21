<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class PointOfSale extends Model
{
    use SoftDeletes;

    protected $table = 'points_of_sale';

    protected $fillable = [
        'name',
        'pos_number',
        'warehouse_id',
        'voucher_letter_default',
        'next_invoice_number_a',
        'next_invoice_number_b',
        'next_invoice_number_c',
        'is_default',
        'active',
    ];

    protected $casts = [
        'is_default'            => 'boolean',
        'active'                => 'boolean',
        'pos_number'            => 'integer',
        'next_invoice_number_a' => 'integer',
        'next_invoice_number_b' => 'integer',
        'next_invoice_number_c' => 'integer',
    ];

    protected static function booted(): void
    {
        static::saving(function (PointOfSale $pos) {
            if ($pos->is_default) {
                static::where('id', '!=', $pos->id)->update(['is_default' => false]);
            }
        });
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeIsDefault($query)
    {
        return $query->where('is_default', true);
    }

    public static function getDefault(): ?self
    {
        return static::where('is_default', true)->first();
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
