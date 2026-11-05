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
    protected $movimientos;
    protected $resumen;

    public function __construct($cliente, $movimientos, $resumen)
    {
        $this->cliente = $cliente;
        $this->movimientos = $movimientos;
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
        
        // Libro de movimientos: venta al débito, cobro al crédito, saldo acumulado
        $data[] = ['MOVIMIENTOS'];
        $data[] = ['Fecha', 'Concepto', 'Débito', 'Crédito', 'Saldo'];

        foreach ($this->movimientos as $movimiento) {
            $data[] = [
                date('d/m/Y', strtotime($movimiento['date'])),
                $movimiento['description'],
                $movimiento['debit'] ? '$' . number_format($movimiento['debit'], 2) : '—',
                $movimiento['credit'] ? '$' . number_format($movimiento['credit'], 2) : '—',
                '$' . number_format($movimiento['balance'], 2),
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
            'B' => 34,
            'C' => 15,
            'D' => 15,
            'E' => 15,
        ];
    }
}