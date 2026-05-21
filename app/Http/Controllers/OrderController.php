<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Services\MovimientoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function __construct(private MovimientoService $movimientoService) {}

    public function index()
    {
        return Inertia::render('Orders/Index', [
            'orders' => Order::with(['supplier', 'products'])->orderBy('date', 'desc')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Orders/Create', [
            'suppliers'  => Supplier::all(),
            'warehouses' => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'pos_number'                    => 'required|integer',
            'order_number'                  => 'required|integer',
            'date'                          => 'required|date',
            'supplier_id'                   => 'required|exists:suppliers,id',
            'warehouse_id'                  => 'nullable|exists:warehouses,id',
            'notes'                         => 'nullable|string',
            'detalles'                      => 'required|array|min:1',
            'detalles.*.articulo_id'        => 'required|exists:products,id',
            'detalles.*.quantity'           => 'required|integer|min:1',
            'detalles.*.unit_price'         => 'required|numeric|min:0',
        ]);

        $warehouseId = $request->warehouse_id ?? Warehouse::isDefault()->value('id');

        $order = Order::create([
            'pos_number'    => $request->pos_number,
            'order_number'  => $request->order_number,
            'date'          => $request->date,
            'supplier_id'   => $request->supplier_id,
            'warehouse_id'  => $warehouseId,
            'user_id'       => auth()->id(),
            'notes'         => $request->notes,
            'surcharge'     => 0,
            'discount'      => 0,
            'subtotal'      => 0,
            'total'         => 0,
        ]);

        $subtotal = 0;
        foreach ($request->detalles as $detalle) {
            $product      = Product::find($detalle['articulo_id']);
            $itemSubtotal = $detalle['quantity'] * $detalle['unit_price'];

            $order->products()->create([
                'supplier_code' => $product->supplier_code,
                'sku'           => $product->sku,
                'name'          => $product->name,
                'unit'          => $product->unit,
                'quantity'      => $detalle['quantity'],
                'discount'      => 0,
                'tax_rate'      => $product->tax_rate,
                'unit_price'    => $detalle['unit_price'],
                'subtotal'      => $itemSubtotal,
                'product_id'    => $detalle['articulo_id'],
            ]);

            $subtotal += $itemSubtotal;
        }

        $order->update(['subtotal' => $subtotal, 'total' => $subtotal]);

        return redirect()->route('orders.index')->with('success', 'Orden creada exitosamente');
    }

    public function show(Order $order)
    {
        return Inertia::render('Orders/Show', [
            'order' => $order->load(['supplier', 'products.product']),
        ]);
    }

    public function edit(Order $order)
    {
        return Inertia::render('Orders/Edit', [
            'order'      => $order->load(['supplier', 'products.product', 'warehouse']),
            'suppliers'  => Supplier::all(),
            'warehouses' => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Order $order)
    {
        $request->validate([
            'pos_number'                    => 'required|integer',
            'order_number'                  => 'required|integer',
            'date'                          => 'required|date',
            'supplier_id'                   => 'required|exists:suppliers,id',
            'warehouse_id'                  => 'nullable|exists:warehouses,id',
            'notes'                         => 'nullable|string',
            'detalles'                      => 'required|array|min:1',
            'detalles.*.articulo_id'        => 'required|exists:products,id',
            'detalles.*.quantity'           => 'required|integer|min:1',
            'detalles.*.unit_price'         => 'required|numeric|min:0',
        ]);

        $order->update([
            'pos_number'    => $request->pos_number,
            'order_number'  => $request->order_number,
            'date'          => $request->date,
            'supplier_id'   => $request->supplier_id,
            'warehouse_id'  => $request->warehouse_id ?? $order->warehouse_id,
            'notes'         => $request->notes,
        ]);

        // Recrear detalles
        $order->products()->delete();

        $subtotal = 0;
        foreach ($request->detalles as $detalle) {
            $product      = Product::find($detalle['articulo_id']);
            $itemSubtotal = $detalle['quantity'] * $detalle['unit_price'];

            $order->products()->create([
                'supplier_code' => $product->supplier_code,
                'sku'           => $product->sku,
                'name'          => $product->name,
                'unit'          => $product->unit,
                'quantity'      => $detalle['quantity'],
                'discount'      => 0,
                'tax_rate'      => $product->tax_rate,
                'unit_price'    => $detalle['unit_price'],
                'subtotal'      => $itemSubtotal,
                'product_id'    => $detalle['articulo_id'],
            ]);

            $subtotal += $itemSubtotal;
        }

        $order->update(['subtotal' => $subtotal, 'total' => $subtotal]);

        return redirect()->route('orders.show', $order)->with('success', 'Orden actualizada exitosamente');
    }

    public function destroy(Order $order)
    {
        $order->delete();

        return redirect()->route('orders.index')->with('success', 'Orden eliminada exitosamente');
    }

    public function getProductsBySupplier($supplierId)
    {
        return response()->json(
            Product::where('supplier_id', $supplierId)->with(['category', 'brand'])->get()
        );
    }

    public function convertToInventory(Order $order)
    {
        if ($order->converted_to_inventory) {
            return redirect()->back()->with('error', 'Esta orden ya fue convertida a inventario');
        }

        $warehouseId = $order->warehouse_id ?? Warehouse::isDefault()->value('id');

        if (! $warehouseId) {
            return redirect()->back()->with('error', 'No hay almacén configurado para esta orden.');
        }

        foreach ($order->products as $detail) {
            $stock = Stock::forProductInWarehouse($detail->product_id, $warehouseId);

            $this->movimientoService->registrar(
                $stock, StockMovement::TYPE_PURCHASE_ENTRY,
                $detail->quantity, $order
            );
        }

        $order->update(['converted_to_inventory' => true]);

        return redirect()->back()->with('success', 'Orden convertida a inventario exitosamente');
    }
}
