<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Localidad;
use App\Models\Provincia;
use App\Services\AfipService;
use App\Traits\HasToastNotifications;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClienteController extends Controller
{
    use HasToastNotifications;
    public function index(Request $request)
    {
        $query = Cliente::query();
        
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('razonsocial', 'like', "%{$search}%")
                  ->orWhere('documentounico', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        $totalResults = $query->count();
        $perPage = $totalResults <= 5 ? $totalResults : 10;
        
        return Inertia::render('Clientes/Index', [
            'clientes' => $query->paginate($perPage)->withQueryString(),
            'filters' => $request->only('search'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Clientes/Create', [
            'provincias' => Provincia::all(),
            'localidades' => Localidad::with('provincia')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'razonsocial' => 'required|string|max:255',
            'documentounico' => 'required|string|max:20',
            'direccion' => 'required|string|max:255',
            'telefono' => 'required|string|max:20',
            'email' => 'nullable|email',
            'codigopostal' => 'required|string|max:10',
            'localidad' => 'required|string|max:100',
            'provincia' => 'required|string|max:100',
            'condicioniva' => 'nullable|string|max:50',
        ]);

        Cliente::create($request->all());

        return redirect()->route('clientes.index')->with('success', 'Cliente creado exitosamente');
    }

    public function edit(Cliente $cliente)
    {
        return Inertia::render('Clientes/Edit', [
            'cliente' => $cliente,
            'provincias' => Provincia::all(),
            'localidades' => Localidad::with('provincia')->get(),
        ]);
    }

    public function update(Request $request, Cliente $cliente)
    {
        $request->validate([
            'razonsocial' => 'required|string|max:255',
            'documentounico' => 'required|string|max:20',
            'direccion' => 'required|string|max:255',
            'telefono' => 'required|string|max:20',
            'email' => 'nullable|email',
            'codigopostal' => 'nullable|string|max:10',
            'localidad' => 'required|string|max:100',
            'provincia' => 'required|string|max:100',
            'condicioniva' => 'nullable|string|max:50',
        ]);

        $cliente->update($request->all());

        return redirect()->route('clientes.index')->with('success', 'Cliente actualizado exitosamente');
    }

    public function destroy(Cliente $cliente)
    {
        $cliente->delete();

        return redirect()->route('clientes.index')->with('success', 'Cliente eliminado exitosamente');
    }

    public function estadoCuenta(Cliente $cliente)
    {
        $facturas = $cliente->facturas()->with(['pagos'])->orderBy('fecha', 'desc')->get();
        
        $resumen = [
            'total_compras' => $facturas->sum('total'),
            'total_pagado' => $facturas->sum(function($factura) {
                return $factura->pagos->sum('monto');
            }),
            'saldo_pendiente' => 0
        ];
        
        $resumen['saldo_pendiente'] = $resumen['total_compras'] - $resumen['total_pagado'];
        
        return Inertia::render('Clientes/EstadoCuenta', [
            'cliente' => $cliente,
            'facturas' => $facturas,
            'resumen' => $resumen
        ]);
    }

    public function exportarExcel(Cliente $cliente)
    {
        $facturas = $cliente->facturas()->with(['pagos'])->orderBy('fecha', 'desc')->get();
        
        $resumen = [
            'total_compras' => $facturas->sum('total'),
            'total_pagado' => $facturas->sum(function($factura) {
                return $factura->pagos->sum('monto');
            }),
            'saldo_pendiente' => 0
        ];
        
        $resumen['saldo_pendiente'] = $resumen['total_compras'] - $resumen['total_pagado'];
        
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\EstadoCuentaExport($cliente, $facturas, $resumen), 
            'estado-cuenta-' . $cliente->razonsocial . '.xlsx');
    }

    public function exportarPdf(Cliente $cliente)
    {
        $facturas = $cliente->facturas()->with(['pagos'])->orderBy('fecha', 'desc')->get();
        
        $resumen = [
            'total_compras' => $facturas->sum('total'),
            'total_pagado' => $facturas->sum(function($factura) {
                return $factura->pagos->sum('monto');
            }),
            'saldo_pendiente' => 0
        ];
        
        $resumen['saldo_pendiente'] = $resumen['total_compras'] - $resumen['total_pagado'];
        
        $pdf = \PDF::loadView('pdf.estado-cuenta', compact('cliente', 'facturas', 'resumen'));
        
        return $pdf->download('estado-cuenta-' . $cliente->razonsocial . '.pdf');
    }

    public function consultarCuit(Request $request)
    {
        \Log::info('AFIP: Petición recibida en controlador', ['request_data' => $request->all()]);
        
        $request->validate([
            'cuit' => 'required|string'
        ]);

        $afipService = new AfipService();
        $resultado = $afipService->consultarDatosFiscales($request->cuit);
        
        \Log::info('AFIP: Resultado del servicio', ['resultado' => $resultado]);

        if (isset($resultado['success']) && $resultado['success'] && isset($resultado['data'])) {
            return response()->json($resultado['data']);
        }

        return response()->json($resultado);
    }

    public function estadosCuenta()
    {
        $clientes = Cliente::whereHas('facturas', function($query) {
            $query->where('pagada', 'NO');
        })->with(['facturas' => function($query) {
            $query->where('pagada', 'NO')->with('pagos');
        }])->paginate(10);

        // Calcular saldo pendiente para cada cliente
        $clientes->getCollection()->transform(function($cliente) {
            $totalFacturas = $cliente->facturas->sum('total');
            $totalPagado = $cliente->facturas->sum(function($factura) {
                return $factura->pagos->sum('monto');
            });
            $cliente->saldo_pendiente = $totalFacturas - $totalPagado;
            return $cliente;
        });

        return Inertia::render('EstadosCuenta/Index', [
            'clientes' => $clientes,
        ]);
    }
}
