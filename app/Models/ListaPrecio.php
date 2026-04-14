<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ListaPrecio extends Model
{
    use SoftDeletes;

    protected $table = 'listas_precios';
    
    protected $fillable = [
        'nombre',
        'porcentaje',
        'default_pos',
        'default_ecommerce'
    ];

    protected $casts = [
        'porcentaje' => 'decimal:2',
        'default_pos' => 'boolean',
        'default_ecommerce' => 'boolean'
    ];

    public function articulos(): BelongsToMany
    {
        return $this->belongsToMany(Articulo::class, 'articulo_lista_precio')
                    ->withPivot('precio')
                    ->withTimestamps();
    }

    public function generarPrecios()
    {
        $articulos = Articulo::all();
        
        foreach ($articulos as $articulo) {
            $precioBase = $articulo->precio ?? 0;
            $precioConIncremento = $precioBase * (1 + ($this->porcentaje / 100));
            
            $this->articulos()->syncWithoutDetaching([
                $articulo->id => ['precio' => $precioConIncremento]
            ]);
        }
    }
}