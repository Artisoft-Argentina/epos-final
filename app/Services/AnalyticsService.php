<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getTopSellingProducts(int $limit = 10, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = DB::table('sale_products')
            ->join('products', 'sale_products.product_id', '=', 'products.id')
            ->join('sales', 'sale_products.sale_id', '=', 'sales.id')
            ->select('products.name as nombre', DB::raw('SUM(sale_products.quantity) as total_vendido'))
            ->groupBy('sale_products.product_id', 'products.name');
        
        if ($startDate) {
            $query->where('sales.date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('sales.date', '<=', $endDate);
        }
        
        return $query->orderByDesc('total_vendido')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getMonthlyRevenue(?string $startDate = null, ?string $endDate = null): array
    {
        $query = DB::table('sales')
            ->select(
                DB::raw('YEAR(date) as year'),
                DB::raw('MONTH(date) as month'),
                DB::raw('SUM(total) as revenue')
            )
            ->where('afip_authorized', true)
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc');
        
        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }
        
        return $query->limit(12)->get()->toArray();
    }

    public function getBestMonth(?string $startDate = null, ?string $endDate = null): ?object
    {
        $query = DB::table('sales')
            ->select(
                DB::raw('YEAR(date) as year'),
                DB::raw('MONTH(date) as month'),
                DB::raw('SUM(total) as revenue')
            )
            ->where('afip_authorized', true)
            ->groupBy('year', 'month');
        
        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }
        
        return $query->orderByDesc('revenue')->first();
    }

    public function getTotalSales(?string $startDate = null, ?string $endDate = null): float
    {
        $query = DB::table('sales')
            ->where('afip_authorized', true);
        
        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }
        
        return $query->sum('total');
    }

    public function getTopClients(int $limit = 10, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->select('customers.business_name as nombre', DB::raw('SUM(sales.total) as total_comprado'))
            ->where('sales.afip_authorized', true)
            ->groupBy('sales.customer_id', 'customers.business_name');
        
        if ($startDate) {
            $query->where('sales.date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('sales.date', '<=', $endDate);
        }
        
        return $query->orderByDesc('total_comprado')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function getTopSellers(?string $startDate = null, ?string $endDate = null): array
    {
        $query = DB::table('sales')
            ->join('users', 'sales.user_id', '=', 'users.id')
            ->select('users.name as vendedor', DB::raw('SUM(sales.total) as total_vendido'))
            ->where('sales.afip_authorized', true)
            ->groupBy('sales.user_id', 'users.name');
        
        if ($startDate) {
            $query->where('sales.date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('sales.date', '<=', $endDate);
        }
        
        return $query->orderByDesc('total_vendido')
            ->limit(10)
            ->get()
            ->toArray();
    }

    public function getLowStock(int $threshold = 10): array
    {
        return DB::table('products')
            ->join('stocks', 'products.id', '=', 'stocks.product_id')
            ->select('products.name as nombre', 'stocks.quantity')
            ->where('stocks.quantity', '<=', $threshold)
            ->orderBy('stocks.quantity')
            ->get()
            ->toArray();
    }
}
