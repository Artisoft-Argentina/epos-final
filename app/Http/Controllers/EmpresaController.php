<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\Warehouse;
use App\Models\PointOfSale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmpresaController extends Controller
{
    public function index()
    {
        $empresa = Setting::first() ?? new Setting();

        return Inertia::render('Empresa/Index', [
            'empresa'    => $empresa,
            'warehouses' => Warehouse::active()->orderBy('is_default', 'desc')->orderBy('name')->get(['id', 'name', 'is_default']),
            'puntosVenta' => PointOfSale::active()->orderBy('is_default', 'desc')->orderBy('pos_number')->get(['id', 'name', 'pos_number', 'is_default']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tax_id'               => 'nullable|integer',
            'business_name'        => 'nullable|string|max:255',
            'address'              => 'nullable|string|max:255',
            'phone'                => 'nullable|string|max:255',
            'email'                => 'nullable|email|max:255',
            'zip_code'             => 'nullable|integer',
            'city_id'              => 'nullable|exists:cities,id',
            'state_id'             => 'nullable|exists:states,id',
            'tax_status'           => 'nullable|string|max:255',
            'gross_income_tax'     => 'nullable|string|max:255',
            'activity_start_date'  => 'nullable|string|max:255',
            'pos_number'           => 'nullable|integer',
            'afip_environment'     => 'nullable|in:homologacion,production',
            'trade_name'           => 'nullable|string|max:255',
            'commercial_address'   => 'nullable|string|max:255',
            'tagline'              => 'nullable|string|max:255',
            'logo'                 => 'nullable|image|max:2048',
            'cert_file'            => 'nullable|file|mimes:pem,crt,cert,txt|max:2048',
            'key_file'             => 'nullable|file|mimes:pem,key,txt|max:2048',
            'next_invoice_number'  => 'nullable|integer',
            'next_order_number'    => 'nullable|integer',
            'next_quote_number'    => 'nullable|integer',
            'next_payment_number'  => 'nullable|integer',
            'next_receipt_number'  => 'nullable|integer',
            'default_ecommerce_warehouse_id'     => 'nullable|exists:warehouses,id',
            'default_ecommerce_point_of_sale_id' => 'nullable|exists:points_of_sale,id',
        ]);

        $data = $request->except(['logo', 'cert_file', 'key_file']);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }

        if ($request->hasFile('cert_file') || $request->hasFile('key_file')) {
            $afipDir = storage_path('app/private/afip');
            if (!is_dir($afipDir)) {
                mkdir($afipDir, 0755, true);
            }
            if ($request->hasFile('cert_file')) {
                $request->file('cert_file')->move($afipDir, 'cert.pem');
            }
            if ($request->hasFile('key_file')) {
                $request->file('key_file')->move($afipDir, 'key.pem');
            }
        }

        $empresa = Setting::first();

        if ($empresa) {
            $empresa->update($data);
        } else {
            Setting::create($data);
        }

        return redirect()->route('empresa.index')->with('success', 'Datos de empresa actualizados correctamente');
    }
}
