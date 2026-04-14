<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Categoria extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'categoria',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($categoria) {
            $categoria->categoria = ucfirst($categoria->categoria);
        });

        static::updating(function ($categoria) {
            $categoria->categoria = ucfirst($categoria->categoria);
        });
    }

    public function articulos()
    {
        return $this->hasMany(Articulo::class);
    }
}
