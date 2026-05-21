<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'address',
        'city_id',
        'state_id',
        'phone',
        'notes',
        'is_default',
        'active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'active'     => 'boolean',
    ];

    protected static function booted(): void
    {
        // Garantizar un único almacén default
        static::saving(function (Warehouse $warehouse) {
            if ($warehouse->is_default) {
                static::where('id', '!=', $warehouse->id ?? 0)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }
        });
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    public function pointsOfSale(): HasMany
    {
        return $this->hasMany(PointOfSale::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function scopeIsDefault(Builder $query): Builder
    {
        return $query->where('is_default', true);
    }

    public static function getDefault(): ?self
    {
        return static::isDefault()->first();
    }
}
