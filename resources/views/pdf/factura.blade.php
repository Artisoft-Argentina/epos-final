<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Factura {{ $factura->voucher_letter }} {{ str_pad($factura->pos_number, 4, '0', STR_PAD_LEFT) }}-{{ str_pad($factura->invoice_number, 8, '0', STR_PAD_LEFT) }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; padding: 10px; }
        .factura-container { width: 100%; max-width: 210mm; }
        .header-row { display: table; width: 100%; border: 2px solid #000; }
        .empresa-col { display: table-cell; width: 40%; padding: 8px; vertical-align: top; }
        .letra-col { display: table-cell; width: 20%; text-align: center; vertical-align: middle; border-left: 2px solid #000; border-right: 2px solid #000; }
        .factura-col { display: table-cell; width: 40%; padding: 8px; vertical-align: top; }
        .letra-factura { font-size: 48px; font-weight: bold; margin: 0; }
        .cod-doc { font-size: 8px; margin: 5px 0; }
        .logo { max-height: 50px; margin-bottom: 5px; }
        .empresa-datos { font-size: 9px; line-height: 1.2; }
        .factura-datos { font-size: 9px; line-height: 1.2; }
        .cliente-section { border: 1px solid #000; padding: 8px; margin: 5px 0; }
        .cliente-row { display: table; width: 100%; margin: 2px 0; }
        .cliente-label { display: table-cell; width: 25%; font-weight: bold; }
        .cliente-value { display: table-cell; width: 75%; }
        .items-table { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 9px; }
        .items-table th, .items-table td { border: 1px solid #000; padding: 3px; text-align: left; }
        .items-table th { background: #f0f0f0; font-weight: bold; }
        .totales-section { width: 50%; float: right; margin: 10px 0; }
        .totales-table { width: 100%; border-collapse: collapse; }
        .totales-table td { border: 1px solid #000; padding: 4px; }
        .cae-section { clear: both; border: 2px solid #000; padding: 8px; margin: 10px 0; background: #f8f8f8; }
        .cae-row { display: table; width: 100%; margin: 2px 0; }
        .cae-label { display: table-cell; width: 30%; font-weight: bold; }
        .cae-value { display: table-cell; width: 70%; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
    </style>
</head>
<body>
    <div class="factura-container">
        <!-- Header con 3 columnas -->
        <div class="header-row">
            <div class="empresa-col">
                @if($empresa->logo)
                    <img src="{{ storage_path('app/public/' . $empresa->logo) }}" class="logo" alt="Logo">
                @endif
                <div class="empresa-datos">
                    <strong>{{ $empresa->business_name }}</strong><br>
                    Domicilio Comercial: {{ $empresa->commercial_address ?: $empresa->address }}<br>
                    Condición frente al IVA: {{ $empresa->tax_status }}<br>
                    @if($empresa->activity_start_date)
                        Fecha de Inicio de Actividades: {{ $empresa->activity_start_date }}<br>
                    @endif
                </div>
            </div>
            
            <div class="letra-col">
                <div class="letra-factura">{{ $factura->voucher_letter }}</div>
                <div class="cod-doc">Cód. {{ $factura->voucher_letter === 'A' ? '01' : ($factura->voucher_letter === 'B' ? '06' : '11') }}</div>
            </div>
            
            <div class="factura-col">
                <div class="factura-datos">
                    <strong>FACTURA</strong><br>
                    Punto de Venta: {{ str_pad($factura->pos_number, 4, '0', STR_PAD_LEFT) }}<br>
                    Comp. Nro: {{ str_pad($factura->invoice_number, 8, '0', STR_PAD_LEFT) }}<br>
                    Fecha de Emisión: {{ $factura->date->format('d/m/Y') }}<br>
                    <strong>CUIT: {{ $empresa->tax_id }}</strong><br>
                    Ingresos Brutos: EXENTO<br>
                    Fecha de Vto. para el pago: {{ $factura->date->format('d/m/Y') }}
                </div>
            </div>
        </div>

        <!-- Datos del Cliente -->
        <div class="cliente-section">
            <div class="cliente-row">
                <div class="cliente-label">Período Facturado Desde:</div>
                <div class="cliente-value">{{ $factura->date->format('d/m/Y') }}</div>
                <div class="cliente-label">Hasta:</div>
                <div class="cliente-value">{{ $factura->date->format('d/m/Y') }}</div>
                <div class="cliente-label">Fecha de Vto. para el pago:</div>
                <div class="cliente-value">{{ $factura->date->format('d/m/Y') }}</div>
            </div>
            <div class="cliente-row">
                <div class="cliente-label">CUIT:</div>
                <div class="cliente-value">{{ $factura->customer->tax_id }}</div>
                <div class="cliente-label">Condición de IVA:</div>
                <div class="cliente-value">{{ $factura->customer->tax_status }}</div>
            </div>
            <div class="cliente-row">
                <div class="cliente-label">Apellido y Nombre / Razón Social:</div>
                <div class="cliente-value" style="width: 75%;">{{ $factura->customer->business_name }}</div>
            </div>
            <div class="cliente-row">
                <div class="cliente-label">Domicilio:</div>
                <div class="cliente-value">{{ $factura->customer->address }}</div>
                <div class="cliente-label">Localidad:</div>
                <div class="cliente-value">{{ $factura->customer->city }}</div>
            </div>
            <div class="cliente-row">
                <div class="cliente-label">Condición de venta:</div>
                <div class="cliente-value">{{ $factura->sale_condition }}</div>
            </div>
        </div>

        <!-- Tabla de Items -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 10%;">Código</th>
                    <th style="width: 40%;">Producto / Servicio</th>
                    <th style="width: 8%;">Cantidad</th>
                    <th style="width: 8%;">U. Medida</th>
                    <th style="width: 12%;">Precio Unit.</th>
                    <th style="width: 8%;">% Bonif.</th>
                    <th style="width: 6%;">IVA</th>
                    <th style="width: 8%;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach($factura->products as $product)
                <tr>
                    <td>{{ $product->sku }}</td>
                    <td>{{ $product->name }}</td>
                    <td class="text-center">{{ number_format($product->pivot->quantity, 2) }}</td>
                    <td class="text-center">{{ $product->unit }}</td>
                    <td class="text-right">${{ number_format($product->pivot->unit_price, 2) }}</td>
                    <td class="text-center">{{ number_format($product->pivot->discount, 2) }}%</td>
                    <td class="text-center">{{ $product->pivot->tax_rate }}%</td>
                    <td class="text-right">${{ number_format($product->pivot->subtotal, 2) }}</td>
                </tr>
                @endforeach
                @for($i = count($factura->products); $i < 10; $i++)
                <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                </tr>
                @endfor
            </tbody>
        </table>

        <!-- Totales -->
        <div class="totales-section">
            <table class="totales-table">
                <tr>
                    <td><strong>Subtotal</strong></td>
                    <td class="text-right">${{ number_format($factura->subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td><strong>IVA 21%</strong></td>
                    <td class="text-right">${{ number_format($factura->total - $factura->subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td><strong>Importe Otros Tributos</strong></td>
                    <td class="text-right">$ 0,00</td>
                </tr>
                <tr style="background: #f0f0f0;">
                    <td><strong>TOTAL</strong></td>
                    <td class="text-right"><strong>${{ number_format($factura->total, 2) }}</strong></td>
                </tr>
            </table>
        </div>

        <!-- Información CAE -->
        <div class="cae-section">
            <div class="cae-row">
                <div class="cae-label">CAE N°:</div>
                <div class="cae-value">{{ $factura->cae }}</div>
            </div>
            <div class="cae-row">
                <div class="cae-label">Fecha de Vto. de CAE:</div>
                <div class="cae-value">{{ $factura->cae_expiration ? \Carbon\Carbon::parse($factura->cae_expiration)->format('d/m/Y') : 'N/A' }}</div>
            </div>
            <div style="margin-top: 5px; font-size: 8px;">
                <strong>Esta Administración Federal no se responsabiliza por los datos ingresados en el detalle de la operación</strong>
            </div>
        </div>
    </div>
</body>
</html>