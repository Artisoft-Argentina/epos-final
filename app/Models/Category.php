<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'active'];

    protected $casts = ['active' => 'boolean'];

    protected static function boot()
    {
        parent::boot();

        static::creating(fn($category) => $category->name = ucfirst($category->name));
        static::updating(fn($category) => $category->name = ucfirst($category->name));
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($term) . '%']);
    }
}
