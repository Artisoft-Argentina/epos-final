<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Sale;
use App\Exports\DashboardExport;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $fechaInicio = $request->get('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $fechaFin    = $request->get('fecha_fin', Carbon::now()->endOfMonth()->format('Y-m-d'));

        $totalVentas    = Sale::whereDate('date', '>=', $fechaInicio)->whereDate('date', '<=', $fechaFin)->sum('total');
        $clientesNuevos = Customer::whereDate('created_at', '>=', $fechaInicio)->whereDate('created_at', '<=', $fechaFin)->count();
        $ventasDelMes   = $totalVentas;

        $facturasImpagas = Sale::whereDate('date', '>=', $fechaInicio)
            ->whereDate('date', '<=', $fechaFin)
            ->where('payment_status', 'NO')
            ->with('payments')
            ->get();

        $saldoImpagas = $facturasImpagas->sum(fn($s) => $s->total - $s->payments->sum('amount'));

        $productosVendidos = DB::table('sale_products')
            ->join('products', 'sale_products.product_id', '=', 'products.id')
            ->join('sales', 'sale_products.sale_id', '=', 'sales.id')
            ->whereDate('sales.date', '>=', $fechaInicio)
            ->whereDate('sales.date', '<=', $fechaFin)
            ->select('products.name', DB::raw('SUM(sale_products.quantity) as total_vendido'))
            ->groupBy('products.id', 'products.name')
            ->orderBy('total_vendido', 'desc')
            ->limit(5)
            ->get();

        $ventasPorDia = Sale::whereDate('date', '>=', $fechaInicio)
            ->whereDate('date', '<=', $fechaFin)
            ->select(DB::raw('date::date as dia'), DB::raw('SUM(total) as total_dia'))
            ->groupBy('dia')
            ->orderBy('dia')
            ->get();

        $ventasPorVendedor = Sale::join('users', 'sales.user_id', '=', 'users.id')
            ->whereDate('sales.date', '>=', $fechaInicio)
            ->whereDate('sales.date', '<=', $fechaFin)
            ->select('users.name', DB::raw('COUNT(*) as total_ventas'), DB::raw('SUM(sales.total) as monto_total'))
            ->groupBy('users.id', 'users.name')
            ->orderBy('monto_total', 'desc')
            ->get();

        return Inertia::render('dashboard', [
            'totalVentas'        => $totalVentas,
            'clientesNuevos'     => $clientesNuevos,
            'ventasDelMes'       => $ventasDelMes,
            'saldoImpagas'       => $saldoImpagas,
            'productosVendidos'  => $productosVendidos,
            'ventasPorDia'       => $ventasPorDia,
            'ventasPorVendedor'  => $ventasPorVendedor,
            'fechaInicio'        => $fechaInicio,
            'fechaFin'           => $fechaFin,
        ]);
    }

    public function exportExcel(Request $request)
    {
        $fechaInicio = $request->get('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $fechaFin    = $request->get('fecha_fin', Carbon::now()->endOfMonth()->format('Y-m-d'));

        $totalVentas    = Sale::whereDate('date', '>=', $fechaInicio)->whereDate('date', '<=', $fechaFin)->sum('total');
        $clientesNuevos = Customer::whereDate('created_at', '>=', $fechaInicio)->whereDate('created_at', '<=', $fechaFin)->count();

        $facturasImpagas = Sale::whereDate('date', '>=', $fechaInicio)
            ->whereDate('date', '<=', $fechaFin)
            ->where('payment_status', 'NO')
            ->with('payments')
            ->get();

        $saldoImpagas = $facturasImpagas->sum(fn($s) => $s->total - $s->payments->sum('amount'));

        $productosVendidos = DB::table('sale_products')
            ->join('products', 'sale_products.product_id', '=', 'products.id')
            ->join('sales', 'sale_products.sale_id', '=', 'sales.id')
            ->whereDate('sales.date', '>=', $fechaInicio)
            ->whereDate('sales.date', '<=', $fechaFin)
            ->select('products.name', DB::raw('SUM(sale_products.quantity) as total_vendido'))
            ->groupBy('products.id', 'products.name')
            ->orderBy('total_vendido', 'desc')
            ->limit(5)
            ->get();

        $ventasPorDia = Sale::whereDate('date', '>=', $fechaInicio)
            ->whereDate('date', '<=', $fechaFin)
            ->select(DB::raw('date::date as dia'), DB::raw('SUM(total) as total_dia'))
            ->groupBy('dia')
            ->orderBy('dia')
            ->get();

        $ventasPorVendedor = Sale::join('users', 'sales.user_id', '=', 'users.id')
            ->whereDate('sales.date', '>=', $fechaInicio)
            ->whereDate('sales.date', '<=', $fechaFin)
            ->select('users.name', DB::raw('COUNT(*) as total_ventas'), DB::raw('SUM(sales.total) as monto_total'))
            ->groupBy('users.id', 'users.name')
            ->orderBy('monto_total', 'desc')
            ->get();

        $data = compact('totalVentas', 'clientesNuevos', 'saldoImpagas', 'productosVendidos', 'ventasPorDia', 'ventasPorVendedor');
        $data['ventasDelMes'] = $totalVentas;

        return Excel::download(new DashboardExport($data), 'reporte-dashboard-' . $fechaInicio . '-' . $fechaFin . '.xlsx');
    }
}
