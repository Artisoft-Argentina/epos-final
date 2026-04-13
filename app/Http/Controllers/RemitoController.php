<?php

namespace App\Http\Controllers;

use App\Models\Remito;
use App\Models\Supplier;
use App\Models\Articulo;
use App\Services\MovimientoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RemitoController extends Controller
{
    public function __construct(private MovimientoService $movimientoService) {}
    public function index()
    {
        return Inertia::render('Remitos/Index', [
            'remitos' => Remito::with(['supplier', 'detalles'])->orderBy('fecha', 'desc')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Remitos/Create', [
            'suppliers' => Supplier::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'ptoventa' => 'required|integer',
            'numremito' => 'required|integer',
            'fecha' => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'detalles' => 'required|array|min:1',
            'detalles.*.articulo_id' => 'required|exists:articulos,id',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'detalles.*.preciounitario' => 'required|numeric|min:0',
        ]);

        $remito = Remito::create([
            'ptoventa' => $request->ptoventa,
            'numremito' => $request->numremito,
            'fecha' => $request->fecha,
            'supplier_id' => $request->supplier_id,
            'user_id' => auth()->id(),
            'recargo' => 0,
            'bonificacion' => 0,
            'subtotal' => 0,
            'total' => 0,
        ]);

        $subtotal = 0;
        foreach ($request->detalles as $detalle) {
            $articulo = Articulo::find($detalle['articulo_id']);
            $subtotalDetalle = $detalle['cantidad'] * $detalle['preciounitario'];
            
            $remito->detalles()->create([
                'codprov' => $articulo->codprov,
                'codarticulo' => $articulo->codarticulo,
                'articulo' => $articulo->articulo,
                'medida' => $articulo->medida,
                'cantidad' => $detalle['cantidad'],
                'bonificacion' => 0,
                'alicuota' => $articulo->alicuota,
                'preciounitario' => $detalle['preciounitario'],
                'subtotal' => $subtotalDetalle,
                'articulo_id' => $detalle['articulo_id'],
            ]);
            $subtotal += $subtotalDetalle;
        }

        $remito->update([
            'subtotal' => $subtotal,
            'total' => $subtotal,
        ]);

        return redirect()->route('remitos.index')->with('success', 'Remito creado exitosamente');
    }

    public function show(Remito $remito)
    {
        return Inertia::render('Remitos/Show', [
            'remito' => $remito->load(['supplier', 'detalles.articulo']),
        ]);
    }

    public function destroy(Remito $remito)
    {
        $remito->delete();
        return redirect()->route('remitos.index')->with('success', 'Remito eliminado exitosamente');
    }

    public function getArticulosBySupplier($supplierId)
    {
        $articulos = Articulo::where('supplier_id', $supplierId)
            ->with(['categoria', 'marca'])
            ->get();
        
        return response()->json($articulos);
    }

    public function convertirAInventario(Remito $remito)
    {
        if ($remito->convertido_inventario) {
            return redirect()->back()->with('error', 'Este remito ya fue convertido a inventario');
        }

        foreach ($remito->detalles as $detalle) {
            $inventario = \App\Models\Inventario::where('articulo_id', $detalle->articulo_id)->first();

            if ($inventario) {
                $inventario->increment('cantidad', $detalle->cantidad);
            } else {
                $inventario = \App\Models\Inventario::create([
                    'articulo_id' => $detalle->articulo_id,
                    'cantidad' => $detalle->cantidad,
                    'supplier_id' => $remito->supplier_id,
                ]);
            }

            $this->movimientoService->registrar(
                $inventario,
                \App\Models\Movimiento::TIPO_ENTRADA_COMPRA,
                $detalle->cantidad,
                $remito
            );
        }

        $remito->update(['convertido_inventario' => true]);

        return redirect()->back()->with('success', 'Remito convertido a inventario exitosamente');
    }
}