<?php

namespace App\Services;

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Picqer\Barcode\BarcodeGeneratorPNG;
use App\Models\Articulo;

class CodigoService
{
    public function generarCodigoBarras($articulo)
    {
        // Usar el código del artículo directamente para el código de barras
        return $articulo->codarticulo;
    }

    public function generarCodigoQR($articulo)
    {
        // Usar el código del artículo directamente para el QR
        return $articulo->codarticulo;
    }

    public function generarImagenCodigoBarras($codigo)
    {
        $generator = new BarcodeGeneratorPNG();
        return $generator->getBarcode($codigo, $generator::TYPE_CODE_128, 2, 50);
    }

    public function generarImagenQR($codigo, $size = 200)
    {
        // Usar SVG en lugar de PNG para evitar dependencia de imagick
        return QrCode::format('svg')
            ->size($size)
            ->errorCorrection('H')
            ->margin(1)
            ->generate($codigo);
    }

    public function buscarArticuloPorCodigo($codigo)
    {
        return Articulo::where('codigo_barras', $codigo)
            ->orWhere('codigo_qr', $codigo)
            ->orWhere('codarticulo', $codigo)
            ->first();
    }

    public function generarEtiquetaCompleta($articulo)
    {
        // Generar ambos códigos si no existen
        $codigoBarras = $this->generarCodigoBarras($articulo);
        $codigoQR = $this->generarCodigoQR($articulo);

        $imagenQR = $this->generarImagenQR($codigoQR);
        $imagenBarras = $this->generarImagenCodigoBarras($codigoBarras);

        return [
            'articulo' => $articulo,
            'codigo_barras' => $codigoBarras,
            'codigo_qr' => $codigoQR,
            'imagen_barras' => base64_encode($imagenBarras),
            'imagen_qr' => base64_encode($imagenQR)
        ];
    }
}