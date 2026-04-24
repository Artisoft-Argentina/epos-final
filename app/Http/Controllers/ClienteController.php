<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\City;
use App\Models\State;
use App\Services\Afip\AfipWebService;
use App\Traits\HasToastNotifications;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClienteController extends Controller
{
    use HasToastNotifications;
    public function index(Request $request)
    {
        $query = Customer::query();
        
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('business_name', 'like', "%{$search}%")
                  ->orWhere('tax_id', 'like', "%{$search}%")
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
            'provincias' => State::all(),
            'localidades' => City::with('state')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'business_name' => 'required|string|max:255',
            'tax_id' => 'required|string|max:20',
            'address' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email',
            'zip_code' => 'required|string|max:10',
            'city_id'  => 'nullable|exists:cities,id',
            'state_id' => 'nullable|exists:states,id',
            'tax_status' => 'nullable|string|max:50',
        ]);

        Customer::create($request->all());

        return redirect()->route('clientes.index')->with('success', 'Cliente creado exitosamente');
    }

    public function edit(Customer $cliente)
    {
        return Inertia::render('Clientes/Edit', [
            'cliente' => $cliente,
            'provincias' => State::all(),
            'localidades' => City::with('state')->get(),
        ]);
    }

    public function update(Request $request, Customer $cliente)
    {
        $request->validate([
            'business_name' => 'required|string|max:255',
            'tax_id' => 'required|string|max:20',
            'address' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email',
            'zip_code' => 'nullable|string|max:10',
            'city_id'  => 'nullable|exists:cities,id',
            'state_id' => 'nullable|exists:states,id',
            'tax_status' => 'nullable|string|max:50',
        ]);

        $cliente->update($request->all());

        return redirect()->route('clientes.index')->with('success', 'Cliente actualizado exitosamente');
    }

    public function destroy(Customer $cliente)
    {
        $cliente->delete();

        return redirect()->route('clientes.index')->with('success', 'Cliente eliminado exitosamente');
    }

    public function estadoCuenta(Customer $cliente)
    {
        $sales = $cliente->sales()->with(['payments'])->orderBy('date', 'desc')->get();
        
        $resumen = [
            'total_compras'   => $sales->sum('total'),
            'total_pagado'    => $sales->sum(fn($s) => $s->payments->sum('amount')),
            'saldo_pendiente' => 0,
        ];
        $resumen['saldo_pendiente'] = $resumen['total_compras'] - $resumen['total_pagado'];
        
        return Inertia::render('Clientes/EstadoCuenta', [
            'cliente'  => $cliente,
            'facturas' => $sales,
            'resumen'  => $resumen,
        ]);
    }

    public function exportarExcel(Customer $cliente)
    {
        $sales = $cliente->sales()->with(['payments'])->orderBy('date', 'desc')->get();
        
        $resumen = [
            'total_compras'   => $sales->sum('total'),
            'total_pagado'    => $sales->sum(fn($s) => $s->payments->sum('amount')),
            'saldo_pendiente' => 0,
        ];
        $resumen['saldo_pendiente'] = $resumen['total_compras'] - $resumen['total_pagado'];
        
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\EstadoCuentaExport($cliente, $sales, $resumen),
            'estado-cuenta-' . $cliente->business_name . '.xlsx'
        );
    }

    public function exportarPdf(Customer $cliente)
    {
        $sales = $cliente->sales()->with(['payments'])->orderBy('date', 'desc')->get();
        
        $resumen = [
            'total_compras'   => $sales->sum('total'),
            'total_pagado'    => $sales->sum(fn($s) => $s->payments->sum('amount')),
            'saldo_pendiente' => 0,
        ];
        $resumen['saldo_pendiente'] = $resumen['total_compras'] - $resumen['total_pagado'];
        
        $pdf = \PDF::loadView('pdf.estado-cuenta', compact('cliente', 'sales', 'resumen'));
        
        return $pdf->download('estado-cuenta-' . $cliente->business_name . '.pdf');
    }

    public function consultarCuit(Request $request)
    {
        \Log::info('AFIP: Petición recibida en controlador', ['request_data' => $request->all()]);
        
        $request->validate([
            'cuit' => 'required|string'
        ]);

        $afipService = new AfipWebService();
        $resultado = $afipService->consultarPadron($request->cuit);
        
        \Log::info('AFIP: Resultado del servicio', ['resultado' => $resultado]);

        return response()->json($resultado);
    }

    public function estadosCuenta()
    {
        $clientes = Customer::whereHas('sales', function($query) {
            $query->where('payment_status', 'NO');
        })->with(['sales' => function($query) {
            $query->where('payment_status', 'NO')->with('payments');
        }])->paginate(10);

        $clientes->getCollection()->transform(function($cliente) {
            $totalSales    = $cliente->sales->sum('total');
            $totalPaid     = $cliente->sales->sum(fn($s) => $s->payments->sum('amount'));
            $cliente->saldo_pendiente = $totalSales - $totalPaid;
            return $cliente;
        });

        return Inertia::render('EstadosCuenta/Index', [
            'clientes' => $clientes,
        ]);
    }
}
