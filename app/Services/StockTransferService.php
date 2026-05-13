<?php

namespace App\Services;

use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\StockTransfer;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class StockTransferService
{
    public function __construct(private MovimientoService $movimientoService) {}

    /**
     * Crear transferencia en estado draft.
     */
    public function request(int $originWarehouseId, int $destinationWarehouseId, array $items, int $userId, ?string $notes = null): StockTransfer
    {
        if ($originWarehouseId === $destinationWarehouseId) {
            throw new InvalidArgumentException('El almacén origen y destino no pueden ser el mismo.');
        }

        return DB::transaction(function () use ($originWarehouseId, $destinationWarehouseId, $items, $userId, $notes) {
            $transfer = StockTransfer::create([
                'transfer_number'        => StockTransfer::nextTransferNumber(),
                'date'                   => now()->toDateString(),
                'origin_warehouse_id'    => $originWarehouseId,
                'destination_warehouse_id' => $destinationWarehouseId,
                'status'                 => 'draft',
                'requested_by_user_id'   => $userId,
                'notes'                  => $notes,
            ]);

            foreach ($items as $item) {
                $transfer->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                ]);
            }

            return $transfer->load('items');
        });
    }

    /**
     * Despachar: descuenta stock del origen y pasa a in_transit.
     */
    public function dispatch(StockTransfer $transfer): StockTransfer
    {
        if ($transfer->status !== 'draft') {
            throw new InvalidArgumentException('Solo se puede despachar una transferencia en estado borrador.');
        }

        return DB::transaction(function () use ($transfer) {
            $transfer = StockTransfer::lockForUpdate()->find($transfer->id);
            $transfer->load('items');

            foreach ($transfer->items as $item) {
                $stock = Stock::where('product_id', $item->product_id)
                    ->where('warehouse_id', $transfer->origin_warehouse_id)
                    ->lockForUpdate()
                    ->first();

                if (!$stock || $stock->quantity < $item->quantity) {
                    throw new InvalidArgumentException(
                        "Stock insuficiente para el producto ID {$item->product_id} en el almacén origen."
                    );
                }

                $this->movimientoService->registrar(
                    $stock,
                    StockMovement::TYPE_TRANSFER_OUT,
                    $item->quantity,
                    $transfer,
                    auth()->id(),
                    "Transferencia #{$transfer->transfer_number} - Despacho"
                );
            }

            $transfer->update(['status' => 'in_transit']);

            return $transfer;
        });
    }

    /**
     * Recibir: suma stock al destino y pasa a received.
     */
    public function receive(StockTransfer $transfer, ?array $receivedQuantities = null): StockTransfer
    {
        if ($transfer->status !== 'in_transit') {
            throw new InvalidArgumentException('Solo se puede recibir una transferencia en tránsito.');
        }

        return DB::transaction(function () use ($transfer, $receivedQuantities) {
            $transfer = StockTransfer::lockForUpdate()->find($transfer->id);
            $transfer->load('items');

            foreach ($transfer->items as $item) {
                $qty = $receivedQuantities[$item->id] ?? $item->quantity;
                $item->update(['received_quantity' => $qty]);

                if ($qty > 0) {
                    $stock = Stock::forProductInWarehouse($item->product_id, $transfer->destination_warehouse_id);
                    $stock = Stock::lockForUpdate()->find($stock->id);

                    $this->movimientoService->registrar(
                        $stock,
                        StockMovement::TYPE_TRANSFER_IN,
                        $qty,
                        $transfer,
                        auth()->id(),
                        "Transferencia #{$transfer->transfer_number} - Recepción"
                    );
                }
            }

            $transfer->update([
                'status'              => 'received',
                'received_by_user_id' => auth()->id(),
            ]);

            return $transfer;
        });
    }

    /**
     * Cancelar: solo si está en draft. Si está in_transit, reversa el egreso.
     */
    public function cancel(StockTransfer $transfer): StockTransfer
    {
        if (!in_array($transfer->status, ['draft', 'in_transit'])) {
            throw new InvalidArgumentException('Solo se puede cancelar una transferencia en borrador o en tránsito.');
        }

        return DB::transaction(function () use ($transfer) {
            $transfer = StockTransfer::lockForUpdate()->find($transfer->id);
            $transfer->load('items');

            if ($transfer->status === 'in_transit') {
                // Reversar el egreso del origen
                foreach ($transfer->items as $item) {
                    $stock = Stock::where('product_id', $item->product_id)
                        ->where('warehouse_id', $transfer->origin_warehouse_id)
                        ->lockForUpdate()
                        ->first();

                    if ($stock) {
                        $this->movimientoService->registrar(
                            $stock,
                            StockMovement::TYPE_RETURN,
                            $item->quantity,
                            $transfer,
                            auth()->id(),
                            "Transferencia #{$transfer->transfer_number} - Cancelación"
                        );
                    }
                }
            }

            $transfer->update(['status' => 'cancelled']);

            return $transfer;
        });
    }
}
