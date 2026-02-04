<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientDashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $cliente = \App\Models\Cliente::where('email', $user->email)->first();
        
        if (!$cliente) {
            return Inertia::render('Client/Dashboard', [
                'compras' => [],
                'cliente' => null,
            ]);
        }
        
        $compras = Factura::with(['articulos', 'pagos', 'entregas'])
            ->where('cliente_id', $cliente->id)
            ->orderBy('fecha', 'desc')
            ->paginate(10);

        // Convertir valores a float
        $compras->getCollection()->transform(function ($factura) {
            $factura->total = (float) $factura->total;
            $factura->articulos->transform(function ($articulo) {
                $articulo->pivot->cantidad = (int) $articulo->pivot->cantidad;
                $articulo->pivot->preciounitario = (float) $articulo->pivot->preciounitario;
                $articulo->pivot->subtotal = (float) $articulo->pivot->subtotal;
                return $articulo;
            });
            return $factura;
        });

        return Inertia::render('Client/Dashboard', [
            'compras' => $compras,
            'cliente' => $cliente,
        ]);
    }

    public function profile()
    {
        $user = auth()->user();
        $cliente = \App\Models\Cliente::where('email', $user->email)->first();

        return Inertia::render('Client/Profile', [
            'user' => $user,
            'cliente' => $cliente,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        $cliente = \App\Models\Cliente::where('email', $user->email)->first();

        $request->validate([
            'name' => 'required|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'direccion' => 'nullable|string|max:255',
        ]);

        $user->update(['name' => $request->name]);
        
        if ($cliente) {
            $cliente->update([
                'razonsocial' => $request->name,
                'telefono' => $request->telefono,
                'direccion' => $request->direccion,
            ]);
        }

        return back()->with('success', 'Perfil actualizado correctamente');
    }
}
