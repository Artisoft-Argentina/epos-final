<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\Quote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PresupuestoController extends Controller
{
    public function index()
    {
        return Inertia::render('Presupuestos/Index', [
            'presupuestos' => Quote::with(['customer', 'user'])->latest()->paginate(10),
        ]);
    }

    public function create()
    {
        return Inertia::render('Presupuestos/Create', [
            'clientes'  => Customer::all(),
            'articulos' => Product::with(['category', 'brand'])->get(),
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
        ]);

        DB::transaction(function () use ($request) {
            $customer = Customer::find($request->customer_id);
            $subtotal = 0;

            $quote = Quote::create([
                'pos_number'     => 1,
                'voucher_letter' => 'P',
                'quote_number'   => Quote::max('quote_number') + 1,
                'tax_id'         => $customer->tax_id,
                'date'           => now(),
                'discount'       => 0,
                'surcharge'      => 0,
                'subtotal'       => 0,
                'total'          => 0,
                'customer_id'    => $request->customer_id,
                'user_id'        => auth()->id(),
            ]);

            foreach ($request->articulos as $item) {
                $product      = Product::find($item['articulo_id']);
                $quantity     = $item['cantidad'];
                $price        = $item['precio'];
                $itemSubtotal = $quantity * $price;

                $quote->products()->attach($product->id, [
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
            }

            $quote->update(['subtotal' => $subtotal, 'total' => $subtotal]);
        });

        return redirect()->route('presupuestos.index')->with('success', 'Presupuesto creado exitosamente');
    }

    public function show(Quote $presupuesto)
    {
        return Inertia::render('Presupuestos/Show', [
            'presupuesto' => $presupuesto->load(['customer', 'user', 'products']),
        ]);
    }

    public function destroy(Quote $presupuesto)
    {
        $presupuesto->delete();

        return redirect()->route('presupuestos.index')->with('success', 'Presupuesto eliminado exitosamente');
    }

    public function convertirAVenta(Quote $presupuesto)
    {
        $sale = DB::transaction(function () use ($presupuesto) {
            $presupuesto->load(['customer', 'products']);

            $sale = Sale::create([
                'pos_number'      => $presupuesto->pos_number ?? 1,
                'voucher_letter'  => 'B',
                'invoice_number'  => Sale::max('invoice_number') + 1,
                'tax_id'          => $presupuesto->tax_id,
                'date'            => now()->format('Y-m-d'),
                'discount'        => $presupuesto->discount ?? 0,
                'surcharge'       => $presupuesto->surcharge ?? 0,
                'additional_discount' => 0,
                'subtotal'        => $presupuesto->subtotal,
                'total'           => $presupuesto->total,
                'payment_status'  => 'NO',
                'sale_condition'  => 'CUENTA CORRIENTE',
                'customer_id'     => $presupuesto->customer_id,
                'user_id'         => auth()->id(),
                'sale_type'       => 'pos',
            ]);

            foreach ($presupuesto->products as $product) {
                $sale->products()->attach($product->id, [
                    'supplier_code' => $product->pivot->supplier_code,
                    'sku'           => $product->pivot->sku,
                    'name'          => $product->pivot->name,
                    'unit'          => $product->pivot->unit,
                    'quantity'      => $product->pivot->quantity,
                    'discount'      => $product->pivot->discount,
                    'tax_rate'      => $product->pivot->tax_rate,
                    'unit_price'    => $product->pivot->unit_price,
                    'subtotal'      => $product->pivot->subtotal,
                ]);
            }

            return $sale;
        });

        return redirect()->route('ventas.show', $sale->id)
            ->with('success', "Presupuesto #{$presupuesto->quote_number} convertido a Factura #{$sale->invoice_number} exitosamente");
    }
}
