<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Etiquetas</title>
    <style>
        * { margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 10mm; }
        .grid {
            width: 100%;
        }
        .grid tr td {
            width: 33.33%;
            padding: 4mm;
            vertical-align: top;
        }
        .label {
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 4mm;
            text-align: center;
            page-break-inside: avoid;
        }
        .product-name {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 2px;
            overflow: hidden;
            max-height: 28px;
        }
        .product-code {
            font-size: 9px;
            color: #666;
            font-family: monospace;
            margin-bottom: 6px;
        }
        .price {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .barcode-img {
            height: 30px;
            max-width: 100%;
        }
        .code-value {
            font-size: 8px;
            font-family: monospace;
            color: #333;
            margin-top: 2px;
            margin-bottom: 6px;
        }
        .qr-img {
            width: 50px;
            height: 50px;
        }
    </style>
</head>
<body>
    <table class="grid" cellpadding="0" cellspacing="0">
        @foreach($etiquetas->chunk(3) as $row)
        <tr>
            @foreach($row as $etiqueta)
            <td>
                <div class="label">
                    <p class="product-name">{{ $etiqueta['articulo']->name }}</p>
                    <p class="product-code">{{ $etiqueta['codigo_barras'] }}</p>
                    <p class="price">${{ number_format($etiqueta['articulo']->price, 2, ',', '.') }}</p>
                    <img src="data:image/png;base64,{{ $etiqueta['imagen_barras'] }}" class="barcode-img"><br>
                    <p class="code-value">{{ $etiqueta['codigo_barras'] }}</p>
                    <img src="data:image/svg+xml;base64,{{ $etiqueta['imagen_qr'] }}" class="qr-img">
                </div>
            </td>
            @endforeach
            @for($i = $row->count(); $i < 3; $i++)
            <td></td>
            @endfor
        </tr>
        @endforeach
    </table>
</body>
</html>
