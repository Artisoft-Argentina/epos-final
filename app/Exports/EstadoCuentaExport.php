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
        // Las personas físicas no tienen CUIT: se documentan con DNI.
        $data[] = ['Documento:', $this->cliente->tax_id ?? $this->cliente->dni];
        $data[] = ['Email:', $this->cliente->email];
        $data[] = ['Teléfono:', $this->cliente->phone];
        $data[] = [''];
        
        // Resumen — las claves vienen en inglés desde CustomerController::accountStatement
        $data[] = ['RESUMEN'];
        $data[] = ['Total Compras:', '$' . number_format($this->resumen['total_sales'], 2)];
        $data[] = ['Total Pagado:', '$' . number_format($this->resumen['total_paid'], 2)];
        $data[] = ['Saldo Pendiente:', '$' . number_format($this->resumen['balance_due'], 2)];
        $data[] = ['Crédito a Favor:', '$' . number_format($this->resumen['credit'], 2)];
        $data[] = [''];
        
        // Encabezados de facturas
        $data[] = ['HISTORIAL DE COMPRAS'];
        $data[] = ['Factura', 'Fecha', 'Total', 'Pagado', 'Saldo Pendiente', 'Estado'];
        
        // Facturas
        foreach ($this->facturas as $sale) {
            $totalPagado = (float) $sale->payments->sum('amount');
            // Una venta cancelada no deja saldo: lo pagado se acreditó al cliente.
            $saldoPendiente = $sale->isCancelled() ? 0 : round((float) $sale->total - $totalPagado, 2);

            $data[] = [
                $sale->invoice_number,
                date('d/m/Y', strtotime($sale->date)),
                '$' . number_format($sale->total, 2),
                '$' . number_format($totalPagado, 2),
                $sale->isCancelled() ? '—' : '$' . number_format($saldoPendiente, 2),
                $sale->payment_status?->label(),
            ];
        }
        
        return $data;
    }

    public function styles(Worksheet $sheet)
    {
        // Los índices siguen el orden de array(): título, datos del cliente,
        // RESUMEN (4 filas) y el encabezado del historial.
        return [
            1  => ['font' => ['bold' => true, 'size' => 16], 'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]],
            3  => ['font' => ['bold' => true]],
            8  => ['font' => ['bold' => true, 'size' => 14]],
            14 => ['font' => ['bold' => true, 'size' => 14]],
            15 => ['font' => ['bold' => true], 'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]]],
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