<?php

namespace App\Services;

use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Model;

class MovimientoService
{
    /**
     * Registra un movimiento de stock para un inventario dado.
     *
     * Este método NO modifica el stock — la modificación de cantidad
     * queda a cargo del controlador. El servicio solo persiste el registro
     * de auditoría dentro de la misma transacción DB.
     *
     * @param  Inventario   $inventario  El inventario afectado
     * @param  string       $tipo        Una de las constantes Movimiento::TIPO_*
     * @param  int          $cantidad    Cantidad absoluta (siempre positiva)
     * @param  Model|null   $referencia  Documento origen (Order, Sale, Delivery, etc.)
     * @param  int|null     $userId      Usuario responsable; usa auth()->id() si null
     * @param  string|null  $motivo      Texto libre para ajustes manuales
     */
    public function registrar(
        Stock $inventario,
        string $tipo,
        int $cantidad,
        ?Model $referencia = null,
        ?int $userId = null,
        ?string $motivo = null
    ): StockMovement {
        if (! array_key_exists($tipo, StockMovement::TYPES)) {
            throw new \InvalidArgumentException("Tipo de movimiento inválido: {$tipo}");
        }

        $movement = StockMovement::create([
            'stock_id'           => $inventario->id,
            'user_id'            => $userId ?? auth()->id(),
            'type'               => $tipo,
            'quantity'           => abs($cantidad),
            'referenceable_type' => $referencia ? get_class($referencia) : null,
            'referenceable_id'   => $referencia?->id,
            'reason'             => $motivo,
            'date'               => now()->toDateString(),
        ]);

        // Actualizar quantity materializada en stocks
        if (in_array($tipo, StockMovement::ENTRY_TYPES)) {
            $inventario->increment('quantity', abs($cantidad));
        } elseif (in_array($tipo, StockMovement::EXIT_TYPES)) {
            $inventario->decrement('quantity', abs($cantidad));
        }

        return $movement;
    }
}
