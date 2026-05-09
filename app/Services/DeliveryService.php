<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Sale;
use App\Models\Stock;
use App\Models\StockMovement;
use Carbon\Carbon;
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
     * Idempotente: si ya está delivered, no hace nada.
     */
    public function markDelivered(Delivery $delivery, int $warehouseId, int $userId): void
    {
        if ($delivery->isDelivered()) {
            return;
        }

        DB::transaction(function () use ($delivery, $warehouseId, $userId) {
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
            $stock = Stock::lockForUpdate()
                ->where('product_id', $delivery->product_id)
                ->where('warehouse_id', $delivery->warehouse_id)
                ->first();

            if (! $stock) {
                $stock = Stock::forProductInWarehouse($delivery->product_id, $delivery->warehouse_id);
                $stock = Stock::lockForUpdate()->find($stock->id);
            }

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
        $stock = Stock::lockForUpdate()
            ->where('product_id', $delivery->product_id)
            ->where('warehouse_id', $warehouseId)
            ->first();

        if (! $stock) {
            $stock = Stock::forProductInWarehouse($delivery->product_id, $warehouseId);
            $stock = Stock::lockForUpdate()->find($stock->id);
        }

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
}
