<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\City;
use App\Models\State;
use App\Traits\HasToastNotifications;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    use HasToastNotifications;

    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('business_name', 'ILIKE', "%{$search}%")
                  ->orWhere('fantasy_name', 'ILIKE', "%{$search}%")
                  ->orWhere('tax_id', 'ILIKE', "%{$search}%")
                  ->orWhere('dni', 'ILIKE', "%{$search}%")
                  ->orWhere('email', 'ILIKE', "%{$search}%")
                  ->orWhere('phone', 'ILIKE', "%{$search}%");
            });
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        if ($request->filled('tax_status')) {
            $query->where('tax_status', $request->tax_status);
        }

        return Inertia::render('Customers/Index', [
            'customers' => $query->orderBy('business_name')->paginate(15)->withQueryString(),
            'filters'   => $request->only(['search', 'active', 'tax_status']),
            'kpis'      => [
                'total'     => Customer::count(),
                'active'    => Customer::where('active', true)->count(),
                'new_month' => Customer::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count(),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Customers/Create', [
            'states' => State::orderBy('name')->get(),
            'cities' => City::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate($this->rules($request));

        Customer::create($request->all());

        return redirect()->route('customers.index')
            ->with('success', 'Cliente creado correctamente.');
    }

    public function edit(Customer $customer)
    {
        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
            'states'   => State::orderBy('name')->get(),
            'cities'   => City::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $request->validate($this->rules($request));

        $customer->update($request->all());

        return redirect()->route('customers.index')
            ->with('success', 'Cliente actualizado correctamente.');
    }

    public function toggleActive(Customer $customer)
    {
        $customer->update(['active' => !$customer->active]);

        return back()->with('success', $customer->active ? 'Cliente activado.' : 'Cliente desactivado.');
    }

    public function show(Customer $customer)
    {
        $sales = $customer->sales()->with('payments')->orderByDesc('created_at')->get();

        $summary = [
            'total_sales' => $sales->sum('total'),
            'total_paid'  => $sales->sum(fn($s) => $s->payments->sum('amount')),
            'balance_due' => 0,
            'credit'      => $customer->credit,
        ];
        $summary['balance_due'] = $summary['total_sales'] - $summary['total_paid'];

        return Inertia::render('Customers/Show', [
            'customer' => $customer->load(['city', 'state']),
            'sales'    => $sales,
            'summary'  => $summary,
        ]);
    }

    public function exportExcel(Customer $customer)
    {
        $sales = $customer->sales()->with('payments')->orderByDesc('created_at')->get();

        $summary = [
            'total_sales' => $sales->sum('total'),
            'total_paid'  => $sales->sum(fn($s) => $s->payments->sum('amount')),
            'balance_due' => 0,
            'credit'      => $customer->credit,
        ];
        $summary['balance_due'] = $summary['total_sales'] - $summary['total_paid'];

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\EstadoCuentaExport($customer, $sales, $summary),
            'estado-cuenta-' . $customer->business_name . '.xlsx'
        );
    }

    public function exportPdf(Customer $customer)
    {
        $sales = $customer->sales()->with('payments')->orderByDesc('created_at')->get();

        $summary = [
            'total_sales' => $sales->sum('total'),
            'total_paid'  => $sales->sum(fn($s) => $s->payments->sum('amount')),
            'balance_due' => 0,
            'credit'      => $customer->credit,
        ];
        $summary['balance_due'] = $summary['total_sales'] - $summary['total_paid'];

        $pdf = \PDF::loadView('pdf.estado-cuenta', compact('customer', 'sales', 'summary'));

        return $pdf->download('estado-cuenta-' . $customer->business_name . '.pdf');
    }

    private function rules(Request $request): array
    {
        return [
            'business_name' => 'required|string|max:255',
            'person_type'   => 'required|in:fisica,juridica',
            'tax_id'        => $request->person_type === 'juridica' ? 'required|string|max:13' : 'nullable|string|max:13',
            'dni'           => $request->person_type === 'fisica'   ? 'required|string|max:8'  : 'nullable|string|max:8',
            'tax_status'    => 'required|string|max:50',
            'fantasy_name'  => 'nullable|string|max:255',
            'phone'         => 'nullable|string|max:50',
            'cellphone'     => 'nullable|string|max:50',
            'email'         => 'nullable|email|max:255',
            'address'       => 'nullable|string|max:255',
            'zip_code'      => 'nullable|string|max:10',
            'city_id'       => 'nullable|exists:cities,id',
            'state_id'      => 'nullable|exists:states,id',
            'notes'         => 'nullable|string',
            'active'        => 'boolean',
        ];
    }
}
