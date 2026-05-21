<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Etiqueta - {{ $product->name }}</title>
    <style>
        * { margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 16px; text-align: center; }
        .product-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
            overflow: hidden;
        }
        .product-sku {
            font-size: 10px;
            color: #666;
            margin-bottom: 12px;
        }
        .price {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 14px;
        }
        .section-title {
            font-size: 9px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .barcode-img {
            height: 40px;
            max-width: 100%;
        }
        .code-value {
            font-size: 10px;
            font-family: monospace;
            color: #333;
            margin-top: 4px;
            margin-bottom: 14px;
        }
        .qr-img {
            width: 80px;
            height: 80px;
        }
    </style>
</head>
<body>
    <p class="product-name">{{ $product->name }}</p>
    <p class="product-sku">{{ $codigo_barras }}</p>
    <p class="price">${{ number_format($product->price, 2, ',', '.') }}</p>

    <p class="section-title">Código de Barras</p>
    <img src="data:image/png;base64,{{ $imagen_barras }}" class="barcode-img">
    <p class="code-value">{{ $codigo_barras }}</p>

    <p class="section-title">Código QR</p>
    <img src="data:image/svg+xml;base64,{{ $imagen_qr }}" class="qr-img">
</body>
</html>
