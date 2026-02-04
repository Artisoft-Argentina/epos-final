<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Buscar cliente vinculado al usuario por email
        $cliente = \App\Models\Cliente::where('email', $user->email)->first();

        if (!$cliente) {
            return Inertia::render('user-dashboard', [
                'facturas' => [],
                'resumen' => [
                    'total_compras' => 0,
                    'total_pagado' => 0,
                    'saldo_pendiente' => 0,
                    'entregas_pendientes' => 0,
                    'total_facturas' => 0,
                ],
                'mensaje' => 'No hay un cliente vinculado a tu cuenta. Contacta al administrador.',
            ]);
        }

        // Obtener facturas del cliente
        $facturas = Factura::with(['articulos', 'pagos', 'entregas'])
            ->where('cliente_id', $cliente->id)
            ->orderBy('fecha', 'desc')
            ->get();

        // Calcular totales
        $totalCompras = $facturas->sum('total');
        $totalPagado = $facturas->sum(fn($f) => $f->pagos->sum('monto'));
        $saldoPendiente = $totalCompras - $totalPagado;

        // Entregas pendientes
        $entregasPendientes = $facturas->flatMap(fn($f) => $f->entregas)
            ->where('estado', 'pendiente')
            ->count();

        return Inertia::render('user-dashboard', [
            'facturas' => $facturas->map(fn($factura) => [
                'id' => $factura->id,
                'numero' => $factura->numfactura,
                'fecha' => $factura->fecha,
                'total' => (float) $factura->total,
                'pagada' => $factura->pagada,
                'total_pagado' => (float) $factura->pagos->sum('monto'),
                'saldo_pendiente' => (float) ($factura->total - $factura->pagos->sum('monto')),
                'articulos' => $factura->articulos->map(fn($art) => [
                    'nombre' => $art->articulo,
                    'cantidad' => (int) $art->pivot->cantidad,
                    'precio' => (float) $art->pivot->preciounitario,
                    'subtotal' => (float) $art->pivot->subtotal,
                ]),
                'pagos' => $factura->pagos->map(fn($pago) => [
                    'fecha' => $pago->fecha_pago,
                    'monto' => (float) $pago->monto,
                    'metodo' => $pago->metodo_pago,
                ]),
                'entregas' => $factura->entregas->map(fn($entrega) => [
                    'fecha' => $entrega->fecha_entrega,
                    'estado' => $entrega->estado,
                    'direccion' => $entrega->direccion_entrega,
                ]),
            ]),
            'resumen' => [
                'total_compras' => (float) $totalCompras,
                'total_pagado' => (float) $totalPagado,
                'saldo_pendiente' => (float) $saldoPendiente,
                'entregas_pendientes' => $entregasPendientes,
                'total_facturas' => $facturas->count(),
            ],
            'cliente' => [
                'nombre' => $cliente->razonsocial,
                'email' => $cliente->email,
            ],
        ]);
    }
}
