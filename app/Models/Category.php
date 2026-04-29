<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
