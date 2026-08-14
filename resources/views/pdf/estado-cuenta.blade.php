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
        <h3>Movimientos</h3>
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Débito</th>
                    <th>Crédito</th>
                    <th>Saldo</th>
                </tr>
            </thead>
            <tbody>
                @foreach($movements as $movement)
                    <tr>
                        <td>{{ date('d/m/Y', strtotime($movement['date'])) }}</td>
                        <td class="{{ $movement['type'] === 'cancellation' ? 'cancelada' : '' }}">
                            {{ $movement['description'] }}
                        </td>
                        <td>{{ $movement['debit'] ? '$' . number_format($movement['debit'], 2) : '—' }}</td>
                        <td class="pagada">{{ $movement['credit'] ? '$' . number_format($movement['credit'], 2) : '—' }}</td>
                        <td>${{ number_format($movement['balance'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</body>
</html>
