<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getTopSellingProducts(int $limit = 10, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = DB::table('articulo_factura')
            ->join('articulos', 'articulo_factura.articulo_id', '=', 'articulos.id')
            ->join('facturas', 'articulo_factura.factura_id', '=', 'facturas.id')
            ->select('articulos.articulo as nombre', DB::raw('SUM(articulo_factura.cantidad) as total_vendido'))
            ->groupBy('articulo_factura.articulo_id', 'articulos.articulo');
        
        if ($startDate) {
            $query->where('facturas.fecha', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('facturas.fecha', '<=', $endDate);
        }
        
        return $query->orderByDesc('total_vendido')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getMonthlyRevenue(?string $startDate = null, ?string $endDate = null): array
    {
        $query = DB::table('facturas')
            ->select(
                DB::raw('YEAR(fecha) as year'),
                DB::raw('MONTH(fecha) as month'),
                DB::raw('SUM(total) as revenue')
            )
            ->where('autorizada_afip', true)
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc');
        
        if ($startDate) {
            $query->where('fecha', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('fecha', '<=', $endDate);
        }
        
        return $query->limit(12)->get()->toArray();
    }

    public function getBestMonth(?string $startDate = null, ?string $endDate = null): ?object
    {
        $query = DB::table('facturas')
            ->select(
                DB::raw('YEAR(fecha) as year'),
                DB::raw('MONTH(fecha) as month'),
                DB::raw('SUM(total) as revenue')
            )
            ->where('autorizada_afip', true)
            ->groupBy('year', 'month');
        
        if ($startDate) {
            $query->where('fecha', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('fecha', '<=', $endDate);
        }
        
        return $query->orderByDesc('revenue')->first();
    }

    public function getTotalSales(?string $startDate = null, ?string $endDate = null): float
    {
        $query = DB::table('facturas')
            ->where('autorizada_afip', true);
        
        if ($startDate) {
            $query->where('fecha', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('fecha', '<=', $endDate);
        }
        
        return $query->sum('total');
    }

    public function getTopClients(int $limit = 10, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = DB::table('facturas')
            ->join('clientes', 'facturas.cliente_id', '=', 'clientes.id')
            ->select('clientes.razonsocial as nombre', DB::raw('SUM(facturas.total) as total_comprado'))
            ->where('facturas.autorizada_afip', true)
            ->groupBy('facturas.cliente_id', 'clientes.razonsocial');
        
        if ($startDate) {
            $query->where('facturas.fecha', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('facturas.fecha', '<=', $endDate);
        }
        
        return $query->orderByDesc('total_comprado')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getTopSellers(?string $startDate = null, ?string $endDate = null): array
    {
        $query = DB::table('facturas')
            ->join('users', 'facturas.user_id', '=', 'users.id')
            ->select('users.name as vendedor', DB::raw('SUM(facturas.total) as total_vendido'))
            ->where('facturas.autorizada_afip', true)
            ->groupBy('facturas.user_id', 'users.name');
        
        if ($startDate) {
            $query->where('facturas.fecha', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('facturas.fecha', '<=', $endDate);
        }
        
        return $query->orderByDesc('total_vendido')
            ->limit(10)
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
