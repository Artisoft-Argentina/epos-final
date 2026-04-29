<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Border;

class EstadoCuentaExport implements FromArray, WithStyles, WithColumnWidths
{
    protected $cliente;
    protected $facturas;
    protected $resumen;

    public function __construct($cliente, $facturas, $resumen)
    {
        $this->cliente = $cliente;
        $this->facturas = $facturas;
        $this->resumen = $resumen;
    }

    public function array(): array
    {
        $data = [];
        
        // Título
        $data[] = ['ESTADO DE CUENTA'];
        $data[] = [''];
        
        // Información del cliente
        $data[] = ['Cliente:', $this->cliente->business_name];
        $data[] = ['Documento:', $this->cliente->tax_id];
        $data[] = ['Email:', $this->cliente->email];
        $data[] = ['Teléfono:', $this->cliente->phone];
        $data[] = [''];
        
        // Resumen
        $data[] = ['RESUMEN'];
        $data[] = ['Total Compras:', '$' . number_format($this->resumen['total_compras'], 2)];
        $data[] = ['Total Pagado:', '$' . number_format($this->resumen['total_pagado'], 2)];
        $data[] = ['Saldo Pendiente:', '$' . number_format($this->resumen['saldo_pendiente'], 2)];
        $data[] = [''];
        
        // Encabezados de facturas
        $data[] = ['HISTORIAL DE COMPRAS'];
        $data[] = ['Factura', 'Fecha', 'Total', 'Pagado', 'Saldo Pendiente', 'Estado'];
        
        // Facturas
        foreach ($this->facturas as $sale) {
            $totalPagado    = $sale->payments->sum('amount');
            $saldoPendiente = $sale->total - $totalPagado;
            
            $data[] = [
                $sale->invoice_number,
                date('d/m/Y', strtotime($sale->date)),
                '$' . number_format($sale->total, 2),
                '$' . number_format($totalPagado, 2),
                '$' . number_format($saldoPendiente, 2),
                $saldoPendiente > 0 ? 'Pendiente' : 'Pagada',
            ];
        }
        
        return $data;
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 16], 'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]],
            3 => ['font' => ['bold' => true]],
            8 => ['font' => ['bold' => true, 'size' => 14]],
            13 => ['font' => ['bold' => true, 'size' => 14]],
            14 => ['font' => ['bold' => true], 'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]]],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15,
            'B' => 20,
            'C' => 15,
            'D' => 15,
            'E' => 18,
            'F' => 12,
        ];
    }
}