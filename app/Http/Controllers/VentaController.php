<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\Stock;
use App\Models\PriceList;
use App\Models\StockMovement;
use App\Models\SalePayment;
use App\Models\Delivery;
use App\Services\AfipService;
use App\Services\MovimientoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class VentaController extends Controller
{
    public function __construct(private MovimientoService $movimientoService) {}

    public function index()
    {
        return Inertia::render('Ventas/Index', [
            'facturas' => Sale::with(['customer', 'user', 'products', 'deliveries'])->latest()->paginate(5),
        ]);
    }

    public function create()
    {
        $priceLists      = PriceList::all();
        $defaultPosList  = $priceLists->where('default_pos', true)->first();

        return Inertia::render('Ventas/Create', [
            'clientes'        => Customer::all(),
            'articulos'       => Product::with(['category', 'brand', 'priceLists', 'images'])->get(),
            'listasPrecios'   => $priceLists,
            'listaDefaultPos' => $defaultPosList,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id'                  => 'required|exists:customers,id',
            'articulos'                    => 'required|array|min:1',
            'articulos.*.articulo_id'      => 'required|exists:products,id',
            'articulos.*.cantidad'         => 'required|integer|min:1',
            'articulos.*.precio'           => 'required|numeric|min:0',
            'surcharge'                    => 'nullable|numeric|min:0',
            'additional_discount'          => 'nullable|numeric|min:0',
            'payment_method'               => 'required|string',
            'payment_amount'               => 'required|numeric|min:0',
            'auto_payment'                 => 'boolean',
            'auto_delivery'                => 'boolean',
            'price_list_id'                => 'nullable|exists:price_lists,id',
            'sale_type'                    => 'nullable|in:pos,ecommerce',
        ]);

        $sale = DB::transaction(function () use ($request) {
            $customer  = Customer::find($request->customer_id);
            $subtotal  = 0;
            $saleType  = $request->sale_type ?? $this->determineSaleType($request);

            $sale = Sale::create([
                'pos_number'          => 3,
                'voucher_letter'      => 'B',
                'invoice_number'      => Sale::max('invoice_number') + 1,
                'tax_id'              => $customer->tax_id,
                'date'                => now()->format('Y-m-d'),
                'discount'            => 0,
                'surcharge'           => $request->surcharge ?? 0,
                'additional_discount' => $request->additional_discount ?? 0,
                'subtotal'            => 0,
                'total'               => 0,
                'payment_status'      => 'SI',
                'sale_condition'      => 'CONTADO',
                'customer_id'         => $request->customer_id,
                'user_id'             => auth()->id(),
                'price_list_id'       => $request->price_list_id,
                'sale_type'           => $saleType,
            ]);

            foreach ($request->articulos as $item) {
                $product      = Product::find($item['articulo_id']);
                $quantity     = $item['cantidad'];
                $price        = $item['precio'];
                $itemSubtotal = $quantity * $price;

                $sale->products()->attach($product->id, [
                    'supplier_code' => $product->supplier_code,
                    'sku'           => $product->sku,
                    'name'          => $product->name,
                    'unit'          => $product->unit,
                    'quantity'      => $quantity,
                    'discount'      => 0,
                    'tax_rate'      => $product->tax_rate,
                    'unit_price'    => $price,
                    'subtotal'      => $itemSubtotal,
                ]);

                $subtotal += $itemSubtotal;

                if ($saleType === 'ecommerce') {
                    Delivery::create([
                        'sale_id'       => $sale->id,
                        'product_id'    => $product->id,
                        'quantity'      => $quantity,
                        'delivery_date' => now()->addDays(3),
                        'notes'         => 'Entrega pendiente - Venta e-commerce',
                        'status'        => Delivery::STATUS_PENDING,
                    ]);
                } else {
                    if ($request->auto_delivery) {
                        $stock = Stock::where('product_id', $product->id)->first();
                        if ($stock) {
                            $stock->decrement('quantity', $quantity);
                            $this->movimientoService->registrar(
                                $stock, StockMovement::TYPE_POS_SALE_EXIT, $quantity, $sale
                            );
                        }

                        Delivery::create([
                            'sale_id'              => $sale->id,
                            'product_id'           => $product->id,
                            'quantity'             => $quantity,
                            'delivery_date'        => now(),
                            'notes'                => 'Entrega inmediata - Venta POS',
                            'status'               => Delivery::STATUS_DELIVERED,
                            'actual_delivery_date' => now(),
                        ]);
                    } else {
                        Delivery::create([
                            'sale_id'       => $sale->id,
                            'product_id'    => $product->id,
                            'quantity'      => $quantity,
                            'delivery_date' => now(),
                            'notes'         => 'Entrega pendiente - Venta POS',
                            'status'        => Delivery::STATUS_PENDING,
                        ]);
                    }
                }
            }

            $surcharge           = $request->surcharge ?? 0;
            $additionalDiscount  = $request->additional_discount ?? 0;
            $total               = $subtotal + $surcharge - $additionalDiscount;

            $sale->update([
                'subtotal'       => $subtotal,
                'total'          => $total,
                'payment_status' => $request->payment_amount >= $total ? 'SI' : 'NO',
            ]);

            if ($request->payment_amount > 0) {
                SalePayment::create([
                    'sale_id'        => $sale->id,
                    'amount'         => $request->payment_amount,
                    'payment_method' => $request->payment_method,
                    'payment_date'   => now(),
                ]);
            }

            return $sale;
        });

        return redirect()->route('ventas.index')->with('success', 'Venta realizada exitosamente');
    }

    private function determineSaleType(Request $request): string
    {
        if (str_contains($request->headers->get('referer', ''), 'ecommerce') ||
            str_contains($request->url(), 'ecommerce')) {
            return 'ecommerce';
        }
        return 'pos';
    }

    public function show(Sale $venta)
    {
        return Inertia::render('Ventas/Show', [
            'factura' => $venta->load(['customer', 'user', 'products', 'payments', 'deliveries.product']),
        ]);
    }

    public function edit(Sale $venta)
    {
        if ($venta->cae) {
            return redirect()->route('ventas.index')->with('error', 'No se puede editar una factura ya autorizada en AFIP');
        }

        return Inertia::render('Ventas/Edit', [
            'factura' => $venta->load(['customer', 'user', 'products']),
        ]);
    }

    public function update(Request $request, Sale $venta)
    {
        if ($venta->cae) {
            return redirect()->route('ventas.index')->with('error', 'No se puede editar una factura ya autorizada en AFIP');
        }

        $request->validate([
            'surcharge'           => 'nullable|numeric|min:0',
            'additional_discount' => 'nullable|numeric|min:0',
        ]);

        $subtotal           = $venta->products->sum('pivot.subtotal');
        $surcharge          = $request->surcharge ?? 0;
        $additionalDiscount = $request->additional_discount ?? 0;
        $total              = $subtotal + $surcharge - $additionalDiscount;

        $venta->update([
            'surcharge'           => $surcharge,
            'additional_discount' => $additionalDiscount,
            'total'               => $total,
        ]);

        return redirect()->route('ventas.index')->with('success', 'Factura actualizada exitosamente');
    }

    public function destroy(Sale $venta)
    {
        DB::transaction(function () use ($venta) {
            foreach ($venta->products as $product) {
                $stock = Stock::where('product_id', $product->id)->first();
                if ($stock) {
                    $stock->increment('quantity', $product->pivot->quantity);
                    $this->movimientoService->registrar(
                        $stock, StockMovement::TYPE_RETURN,
                        $product->pivot->quantity, $venta, null,
                        'Reversión por eliminación de factura'
                    );
                }
            }

            $venta->delete();
        });

        return redirect()->route('ventas.index')->with('success', 'Venta eliminada exitosamente');
    }

    public function autorizarAfip(Sale $factura)
    {
        try {
            $afipService = new AfipService();
            $resultado   = $afipService->autorizarFactura($factura);

            if ($resultado['success']) {
                return redirect()->route('ventas.index')
                    ->with('success', 'Factura autorizada en AFIP correctamente. CAE: ' . $resultado['cae']);
            }

            return redirect()->route('ventas.index')
                ->with('error', 'Error al autorizar en AFIP: ' . $resultado['error']);
        } catch (\Exception $e) {
            return redirect()->route('ventas.index')
                ->with('error', 'Error al autorizar en AFIP: ' . $e->getMessage());
        }
    }
}
