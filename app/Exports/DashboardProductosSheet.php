<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithHeadings;

class DashboardProductosSheet implements FromArray, WithTitle, WithHeadings
{
    protected $productos;

    public function __construct($productos)
    {
        $this->productos = $productos;
    }

    public function array(): array
    {
        return collect($this->productos)->map(function ($producto) {
            return [
                $producto->name,
                $producto->total_vendido,
            ];
        })->toArray();
    }

    public function headings(): array
    {
        return ['Producto', 'Cantidad Vendida'];
    }

    public function title(): string
    {
        return 'Productos Más Vendidos';
    }
}