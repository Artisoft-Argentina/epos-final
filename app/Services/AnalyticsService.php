<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getTopSellingProducts(int $limit = 10): array
    {
        return DB::table('articulo_factura')
            ->join('articulos', 'articulo_factura.articulo_id', '=', 'articulos.id')
            ->select('articulos.articulo as nombre', DB::raw('SUM(articulo_factura.cantidad) as total_vendido'))
            ->groupBy('articulo_factura.articulo_id', 'articulos.articulo')
            ->orderByDesc('total_vendido')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getMonthlyRevenue(): array
    {
        return DB::table('facturas')
            ->select(
                DB::raw('YEAR(fecha) as year'),
                DB::raw('MONTH(fecha) as month'),
                DB::raw('SUM(total) as revenue')
            )
            ->where('autorizada_afip', true)
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->limit(12)
            ->get()
            ->toArray();
    }

    public function getBestMonth(): ?object
    {
        return DB::table('facturas')
            ->select(
                DB::raw('YEAR(fecha) as year'),
                DB::raw('MONTH(fecha) as month'),
                DB::raw('SUM(total) as revenue')
            )
            ->where('autorizada_afip', true)
            ->groupBy('year', 'month')
            ->orderByDesc('revenue')
            ->first();
    }

    public function getTotalSales(): float
    {
        return DB::table('facturas')
            ->where('autorizada_afip', true)
            ->sum('total');
    }

    public function getTopClients(int $limit = 10): array
    {
        return DB::table('facturas')
            ->join('clientes', 'facturas.cliente_id', '=', 'clientes.id')
            ->select('clientes.nombre', DB::raw('SUM(facturas.total) as total_comprado'))
            ->where('facturas.autorizada_afip', true)
            ->groupBy('facturas.cliente_id', 'clientes.nombre')
            ->orderByDesc('total_comprado')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getLowStock(int $threshold = 10): array
    {
        return DB::table('articulos')
            ->join('inventarios', 'articulos.id', '=', 'inventarios.articulo_id')
            ->select('articulos.articulo as nombre', 'inventarios.cantidad')
            ->where('inventarios.cantidad', '<=', $threshold)
            ->orderBy('inventarios.cantidad')
            ->get()
            ->toArray();
    }
}
