<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientDashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $cliente = Customer::where('email', $user->email)->first();

        if (!$cliente) {
            return Inertia::render('Client/Dashboard', [
                'compras' => [],
                'cliente' => null,
            ]);
        }

        $compras = Sale::with(['products', 'payments', 'deliveries'])
            ->where('customer_id', $cliente->id)
            ->orderBy('date', 'desc')
            ->paginate(10);

        return Inertia::render('Client/Dashboard', [
            'compras' => $compras,
            'cliente' => $cliente,
        ]);
    }

    public function profile()
    {
        $user = auth()->user();
        $cliente = Customer::where('email', $user->email)->first();

        return Inertia::render('Client/Profile', [
            'user' => $user,
            'cliente' => $cliente,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        $cliente = Customer::where('email', $user->email)->first();

        $request->validate([
            'name'    => 'required|string|max:255',
            'phone'   => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
        ]);

        $user->update(['name' => $request->name]);

        if ($cliente) {
            $cliente->update([
                'business_name' => $request->name,
                'phone'         => $request->phone,
                'address'       => $request->address,
            ]);
        }

        return back()->with('success', 'Perfil actualizado correctamente');
    }
}
