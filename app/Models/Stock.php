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
        'warehouse_id',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public static function forProductInWarehouse(int $productId, int $warehouseId): self
    {
        return static::firstOrCreate(
            ['product_id' => $productId, 'warehouse_id' => $warehouseId],
            ['quantity' => 0, 'active' => true]
        );
    }

    // Tipos de movimiento que representan transacciones de negocio reales
    // Los movimientos de conciliación se excluyen para evitar loops
    private const BUSINESS_ENTRY_TYPES = [
        StockMovement::TYPE_PURCHASE_ENTRY,
        StockMovement::TYPE_ASSISTANT_ENTRY,
        StockMovement::TYPE_ADJUSTMENT_ENTRY,
        StockMovement::TYPE_RETURN,
        StockMovement::TYPE_TRANSFER_IN,
    ];

    private const BUSINESS_EXIT_TYPES = [
        StockMovement::TYPE_DELIVERY_EXIT,
        StockMovement::TYPE_POS_SALE_EXIT,
        StockMovement::TYPE_ADJUSTMENT_EXIT,
        StockMovement::TYPE_TRANSFER_OUT,
    ];

    public function calculatedQuantity(): int
    {
        $entries = $this->movements()->whereIn('type', self::BUSINESS_ENTRY_TYPES)->sum('quantity');
        $exits   = $this->movements()->whereIn('type', self::BUSINESS_EXIT_TYPES)->sum('quantity');
        return (int) ($entries - $exits);
    }

    // Diferencia entre quantity calculada (movimientos de negocio) y la materializada
    // Positivo: falta stock en la columna (hay más en movimientos)
    // Negativo: sobra stock en la columna (hay menos en movimientos)
    public function reconciliationDiff(): int
    {
        return $this->calculatedQuantity() - $this->quantity;
    }

    public function needsReconciliation(): bool
    {
        return $this->reconciliationDiff() !== 0;
    }
}
