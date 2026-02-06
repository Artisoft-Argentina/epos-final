<?php

namespace App\Http\Controllers;

use App\Models\Articulo;
use App\Models\Cliente;
use App\Models\Factura;
use App\Models\Presupuesto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PresupuestoController extends Controller
{
    public function index()
    {
        return Inertia::render('Presupuestos/Index', [
            'presupuestos' => Presupuesto::with(['cliente', 'user'])->latest()->paginate(10),
        ]);
    }

    public function create()
    {
        return Inertia::render('Presupuestos/Create', [
            'clientes' => Cliente::all(),
            'articulos' => Articulo::with(['categoria', 'marca'])->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cliente_id' => 'required|exists:clientes,id',
            'articulos' => 'required|array|min:1',
            'articulos.*.articulo_id' => 'required|exists:articulos,id',
            'articulos.*.cantidad' => 'required|integer|min:1',
            'articulos.*.precio' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request) {
            $cliente = Cliente::find($request->cliente_id);
            $subtotal = 0;

            // Crear presupuesto
            $presupuesto = Presupuesto::create([
                'ptoventa' => 1,
                'letracomprobante' => 'P',
                'numpresupuesto' => Presupuesto::max('numpresupuesto') + 1,
                'cuit' => $cliente->documentounico,
                'fecha' => now(),
                'bonificacion' => 0,
                'recargo' => 0,
                'subtotal' => 0,
                'total' => 0,
                'cliente_id' => $request->cliente_id,
                'user_id' => auth()->id(),
            ]);

            // Procesar artículos
            foreach ($request->articulos as $item) {
                $articulo = Articulo::find($item['articulo_id']);
                $cantidad = $item['cantidad'];
                $precio = $item['precio'];
                $itemSubtotal = $cantidad * $precio;
                $alicuota = $articulo->alicuota;

                // Agregar a presupuesto
                $presupuesto->articulos()->attach($articulo->id, [
                    'codprov' => $articulo->codprov,
                    'codarticulo' => $articulo->codarticulo,
                    'articulo' => $articulo->articulo,
                    'medida' => $articulo->medida,
                    'cantidad' => $cantidad,
                    'bonificacion' => 0,
                    'alicuota' => $alicuota,
                    'preciounitario' => $precio,
                    'subtotal' => $itemSubtotal,
                ]);

                $subtotal += $itemSubtotal;
            }

            // Actualizar totales
            $presupuesto->update([
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ]);
        });

        return redirect()->route('presupuestos.index')->with('success', 'Presupuesto creado exitosamente');
    }

    public function show(Presupuesto $presupuesto)
    {
        return Inertia::render('Presupuestos/Show', [
            'presupuesto' => $presupuesto->load(['cliente', 'user', 'articulos']),
        ]);
    }

    public function destroy(Presupuesto $presupuesto)
    {
        $presupuesto->delete();

        return redirect()->route('presupuestos.index')->with('success', 'Presupuesto eliminado exitosamente');
    }

    public function convertirAVenta(Presupuesto $presupuesto)
    {
        $factura = DB::transaction(function () use ($presupuesto) {
            $presupuesto->load(['cliente', 'articulos']);

            // Crear factura desde el presupuesto
            $factura = Factura::create([
                'ptoventa' => $presupuesto->ptoventa ?? 1,
                'letracomprobante' => 'B',
                'numfactura' => Factura::max('numfactura') + 1,
                'cuit' => $presupuesto->cuit,
                'fecha' => now()->format('Y-m-d'),
                'bonificacion' => $presupuesto->bonificacion ?? 0,
                'recargo' => $presupuesto->recargo ?? 0,
                'descuento' => 0,
                'subtotal' => $presupuesto->subtotal,
                'total' => $presupuesto->total,
                'pagada' => 'NO',
                'condicionventa' => 'CUENTA CORRIENTE',
                'cliente_id' => $presupuesto->cliente_id,
                'user_id' => auth()->id(),
                'tipo_venta' => 'pos',
            ]);

            // Copiar los artículos del presupuesto a la factura
            foreach ($presupuesto->articulos as $articulo) {
                $factura->articulos()->attach($articulo->id, [
                    'codprov' => $articulo->pivot->codprov,
                    'codarticulo' => $articulo->pivot->codarticulo,
                    'articulo' => $articulo->pivot->articulo,
                    'medida' => $articulo->pivot->medida,
                    'cantidad' => $articulo->pivot->cantidad,
                    'bonificacion' => $articulo->pivot->bonificacion,
                    'alicuota' => $articulo->pivot->alicuota,
                    'preciounitario' => $articulo->pivot->preciounitario,
                    'subtotal' => $articulo->pivot->subtotal,
                ]);
            }

            return $factura;
        });

        return redirect()->route('ventas.show', $factura->id)
            ->with('success', "Presupuesto #{$presupuesto->numpresupuesto} convertido a Factura #{$factura->numfactura} exitosamente");
    }
}
