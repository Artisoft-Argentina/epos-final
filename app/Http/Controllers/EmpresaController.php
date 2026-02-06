<?php

namespace App\Http\Controllers;

use App\Models\InitialSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EmpresaController extends Controller
{
    public function index()
    {
        $empresa = InitialSetting::first() ?? new InitialSetting();
        
        return Inertia::render('Empresa/Index', [
            'empresa' => $empresa
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cuit' => 'nullable|integer',
            'razonsocial' => 'nullable|string|max:255',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'codigopostal' => 'nullable|integer',
            'localidad' => 'nullable|string|max:255',
            'provincia' => 'nullable|string|max:255',
            'condicioniva' => 'nullable|string|max:255',
            'iibb' => 'nullable|string|max:255',
            'inicioactividades' => 'nullable|string|max:255',
            'puntoventa' => 'nullable|integer',
            'afip_ambiente' => 'nullable|in:homologacion,production',
            'nombrefantasia' => 'nullable|string|max:255',
            'domiciliocomercial' => 'nullable|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'logo' => 'nullable|image|max:2048',
            'cert_file' => 'nullable|file|mimes:pem,crt,cert,txt|max:2048',
            'key_file' => 'nullable|file|mimes:pem,key,txt|max:2048',
            'numfactura' => 'nullable|integer',
            'numremito' => 'nullable|integer',
            'numpresupuesto' => 'nullable|integer',
            'numpago' => 'nullable|integer',
            'numrecibo' => 'nullable|integer',
        ]);

        $data = $request->except(['logo', 'cert_file', 'key_file']);
        
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }

        // Handle AFIP certificate files
        if ($request->hasFile('cert_file') || $request->hasFile('key_file')) {
            $afipDir = storage_path('app/private/afip');
            if (!is_dir($afipDir)) {
                mkdir($afipDir, 0755, true);
            }

            if ($request->hasFile('cert_file')) {
                $certPath = $afipDir . '/cert.pem';
                $request->file('cert_file')->move($afipDir, 'cert.pem');
            }

            if ($request->hasFile('key_file')) {
                $keyPath = $afipDir . '/key.pem';
                $request->file('key_file')->move($afipDir, 'key.pem');
            }
        }

        $empresa = InitialSetting::first();
        
        if ($empresa) {
            $empresa->update($data);
        } else {
            InitialSetting::create($data);
        }

        return redirect()->route('empresa.index')->with('success', 'Datos de empresa actualizados correctamente');
    }
}