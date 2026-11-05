<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Sale;
use App\Models\Stock;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DeliveryService
{
    public function __construct(private MovimientoService $movimientoService) {}

    /**
     * Crea una Delivery. Si status=delivered, descuenta stock del almacén indicado.
     * Devuelve la Delivery creada.
     */
    public function create(
        Sale $sale,
        int $productId,
        int $quantity,
        int $warehouseId,
        string $status,
        ?Carbon $deliveryDate = null,
        ?string $notes = null,
        ?int $userId = null,
    ): Delivery {
        return DB::transaction(function () use ($sale, $productId, $quantity, $warehouseId, $status, $deliveryDate, $notes, $userId) {
            $delivery = Delivery::create([
                'sale_id'              => $sale->id,
                'product_id'           => $productId,
                'warehouse_id'         => $warehouseId,
                'quantity'             => $quantity,
                'delivery_date'        => $deliveryDate ?? now(),
                'notes'                => $notes,
                'status'               => $status,
                'actual_delivery_date' => $status === Delivery::STATUS_DELIVERED ? now() : null,
                'delivered_by_user_id' => $status === Delivery::STATUS_DELIVERED ? $userId : null,
            ]);

            if ($status === Delivery::STATUS_DELIVERED) {
                $this->descontar($delivery, $warehouseId);
            }

            return $delivery;
        });
    }

    /**
     * Marca una Delivery pendiente como entregada y descuenta stock.
     * Toma lock sobre la fila y exige estado PENDING para evitar el doble
     * descuento por doble submit / concurrencia. Idempotente si ya está entregada.
     */
    public function markDelivered(Delivery $delivery, int $warehouseId, int $userId): void
    {
        DB::transaction(function () use ($delivery, $warehouseId, $userId) {
            /** @var Delivery $delivery */
            $delivery = Delivery::lockForUpdate()->findOrFail($delivery->id);

            if ($delivery->status !== Delivery::STATUS_PENDING) {
                // Ya entregada -> idempotente; cancelada -> no se puede entregar.
                if ($delivery->isDelivered()) {
                    return;
                }
                throw new RuntimeException('La entrega no está pendiente y no puede marcarse como entregada.');
            }

            $delivery->update([
                'warehouse_id'         => $warehouseId,
                'status'               => Delivery::STATUS_DELIVERED,
                'actual_delivery_date' => now(),
                'delivered_by_user_id' => $userId,
            ]);

            $this->descontar($delivery, $warehouseId);
        });
    }

    /**
     * Revierte una entrega ya entregada: suma stock al almacén original (TYPE_RETURN).
     */
    public function revert(Delivery $delivery, string $reason): void
    {
        if (! $delivery->isDelivered()) {
            return;
        }

        DB::transaction(function () use ($delivery, $reason) {
            $stock = $this->lockedStock($delivery->product_id, $delivery->warehouse_id);

            $this->movimientoService->registrar(
                $stock,
                StockMovement::TYPE_RETURN,
                $delivery->quantity,
                $delivery,
                null,
                $reason
            );

            $delivery->update(['status' => Delivery::STATUS_CANCELLED]);
        });
    }

    private function descontar(Delivery $delivery, int $warehouseId): void
    {
        $stock = $this->lockedStock($delivery->product_id, $warehouseId);

        if ($stock->quantity < $delivery->quantity) {
            $productName   = $delivery->product?->name   ?? "ID {$delivery->product_id}";
            $warehouseName = $delivery->warehouse?->name ?? "ID {$warehouseId}";

            throw new RuntimeException(
                "Stock insuficiente para entregar \"{$productName}\" desde el almacén \"{$warehouseName}\". Disponible: {$stock->quantity}, requerido: {$delivery->quantity}."
            );
        }

        $this->movimientoService->registrar(
            $stock,
            StockMovement::TYPE_DELIVERY_EXIT,
            $delivery->quantity,
            $delivery
        );
    }

    /**
     * Obtiene (o crea) la fila de stock producto+almacén con lockForUpdate.
     * Maneja la carrera de creación concurrente: si otra transacción crea la
     * fila primero (viola el unique product+warehouse), la re-selecciona.
     */
    private function lockedStock(int $productId, int $warehouseId): Stock
    {
        $stock = Stock::lockForUpdate()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->first();

        if ($stock) {
            return $stock;
        }

        try {
            Stock::forProductInWarehouse($productId, $warehouseId);
        } catch (QueryException $e) {
            // Otra transacción creó la fila en paralelo; la tomamos abajo con lock.
        }

        return Stock::lockForUpdate()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->firstOrFail();
    }
}
