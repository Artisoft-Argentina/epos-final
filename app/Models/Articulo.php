<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Articulo extends Model
{
    protected $fillable = [
        'codprov',
        'codarticulo',
        'articulo',
        'descripcion',
        'medida',
        'precio',
        'alicuota',
        'categoria_id',
        'marca_id',
        'supplier_id',
        'stockminimo',
    ];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function marca()
    {
        return $this->belongsTo(Marca::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function listasPrecios()
    {
        return $this->belongsToMany(ListaPrecio::class, 'articulo_lista_precio')
                    ->withPivot('precio')
                    ->withTimestamps();
    }

    public function imagenes()
    {
        return $this->hasMany(ArticuloImagen::class)->orderBy('orden');
    }

    public function imagenPrincipal()
    {
        return $this->hasOne(ArticuloImagen::class)->where('es_principal', true);
    }

    public function inventario()
    {
        return $this->hasOne(Inventario::class);
    }

    public function getPrecioVentaAttribute()
    {
        // Intentar obtener precio de lista por defecto
        $listaPorDefecto = $this->listasPrecios()->wherePivot('precio', '>', 0)->first();
        
        if ($listaPorDefecto) {
            return $listaPorDefecto->pivot->precio;
        }
        
        // Si no hay lista de precios, usar precio base
        return $this->precio ?? 0;
    }
}
