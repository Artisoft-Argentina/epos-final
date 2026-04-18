<?php

namespace App\Services;

use App\Models\Inventario;
use App\Models\Movimiento;
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
     * @param  Model|null   $referencia  Documento origen (Remito, Factura, Entrega, etc.)
     * @param  int|null     $userId      Usuario responsable; usa auth()->id() si null
     * @param  string|null  $motivo      Texto libre para ajustes manuales
     */
    public function registrar(
        Inventario $inventario,
        string $tipo,
        int $cantidad,
        ?Model $referencia = null,
        ?int $userId = null,
        ?string $motivo = null
    ): Movimiento {
        if (! array_key_exists($tipo, Movimiento::TIPOS)) {
            throw new \InvalidArgumentException("Tipo de movimiento inválido: {$tipo}");
        }

        return Movimiento::create([
            'inventario_id'      => $inventario->id,
            'user_id'            => $userId ?? auth()->id(),
            'tipo'               => $tipo,
            'cantidad'           => abs($cantidad),
            'referenciable_type' => $referencia ? get_class($referencia) : null,
            'referenciable_id'   => $referencia?->id,
            'motivo'             => $motivo,
            'fecha'              => now()->toDateString(),
        ]);
    }
}
