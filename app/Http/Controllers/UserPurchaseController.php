<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use App\Models\Cliente;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserPurchaseController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        $client = Cliente::where('email', $user->email)->first();
        
        $facturas = collect();
        if ($client) {
            $facturas = Factura::where('cliente_id', $client->id)
                ->with(['articulos', 'pagos'])
                ->orderBy('created_at', 'desc')
                ->get();
        }
        
        return Inertia::render('user/purchases', [
            'facturas' => $facturas
        ]);
    }
}
