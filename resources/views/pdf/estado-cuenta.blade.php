<!DOCTYPE html>
{{-- Recibe customer, sales y summary (total_sales, total_paid, balance_due, credit)
     desde CustomerController::exportPdf. --}}
<html>
<head>
    <meta charset="utf-8">
    <title>Estado de Cuenta - {{ $customer->business_name }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .cliente-info { margin-bottom: 20px; }
        .resumen { margin-bottom: 30px; }
        .resumen table { width: 100%; border-collapse: collapse; }
        .resumen th, .resumen td { border: 1px solid #ddd; padding: 8px; text-align: right; }
        .resumen th { background-color: #f5f5f5; }
        .facturas table { width: 100%; border-collapse: collapse; }
        .facturas th, .facturas td { border: 1px solid #ddd; padding: 6px; }
        .facturas th { background-color: #f5f5f5; text-align: center; }
        .pendiente { color: #dc3545; }
        .pagada { color: #28a745; }
        .cancelada { color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Estado de Cuenta</h1>
        <h2>{{ $customer->business_name }}</h2>
    </div>

    <div class="cliente-info">
        <p><strong>Documento:</strong> {{ $customer->tax_id ?? $customer->dni }}</p>
        <p><strong>Email:</strong> {{ $customer->email }}</p>
        <p><strong>Teléfono:</strong> {{ $customer->phone }}</p>
    </div>

    <div class="resumen">
        <h3>Resumen</h3>
        <table>
            <tr>
                <th>Total Compras</th>
                <th>Total Pagado</th>
                <th>Saldo Pendiente</th>
                <th>Crédito a Favor</th>
            </tr>
            <tr>
                <td>${{ number_format($summary['total_sales'], 2) }}</td>
                <td>${{ number_format($summary['total_paid'], 2) }}</td>
                <td class="{{ $summary['balance_due'] > 0 ? 'pendiente' : 'pagada' }}">
                    ${{ number_format($summary['balance_due'], 2) }}
                </td>
                <td>${{ number_format($summary['credit'], 2) }}</td>
            </tr>
        </table>
    </div>

    <div class="facturas">
        <h3>Historial de Compras</h3>
        <table>
            <thead>
                <tr>
                    <th>Factura</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Pagado</th>
                    <th>Saldo</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sales as $sale)
                    @php
                        $isCancelled = $sale->isCancelled();
                        $totalPaid   = (float) $sale->payments->sum('amount');
                        // Una venta cancelada no deja saldo: lo pagado se acreditó al cliente.
                        $balance     = $isCancelled ? 0 : round((float) $sale->total - $totalPaid, 2);
                    @endphp
                    <tr>
                        <td>{{ $sale->invoice_number }}</td>
                        <td>{{ date('d/m/Y', strtotime($sale->date)) }}</td>
                        <td>${{ number_format($sale->total, 2) }}</td>
                        <td>${{ number_format($totalPaid, 2) }}</td>
                        <td class="{{ $isCancelled ? 'cancelada' : ($balance > 0 ? 'pendiente' : 'pagada') }}">
                            {{ $isCancelled ? '—' : '$' . number_format($balance, 2) }}
                        </td>
                        <td>{{ $sale->payment_status?->label() }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</body>
</html>
