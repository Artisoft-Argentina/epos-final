<?php

namespace App\Services;

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Picqer\Barcode\BarcodeGeneratorPNG;
use App\Models\Articulo;

class CodigoService
{
    public function generarCodigoBarras($articulo)
    {
        if (!$articulo->codigo_barras) {
            // Generar código de barras único basado en el ID del artículo
            $codigo = 'ART' . str_pad($articulo->id, 8, '0', STR_PAD_LEFT);
            $articulo->update(['codigo_barras' => $codigo]);
        }
        
        return $articulo->codigo_barras;
    }

    public function generarCodigoQR($articulo)
    {
        if (!$articulo->codigo_qr) {
            // Generar código QR único basado en el ID del artículo
            $codigo = 'QR' . str_pad($articulo->id, 8, '0', STR_PAD_LEFT);
            $articulo->update(['codigo_qr' => $codigo]);
        }
        
        return $articulo->codigo_qr;
    }

    public function generarImagenCodigoBarras($codigo)
    {
        $generator = new BarcodeGeneratorPNG();
        return $generator->getBarcode($codigo, $generator::TYPE_CODE_128, 2, 50);
    }

    public function generarImagenQR($codigo, $size = 200)
    {
        return QrCode::format('png')
            ->size($size)
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

        return [
            'articulo' => $articulo,
            'codigo_barras' => $codigoBarras,
            'codigo_qr' => $codigoQR,
            'imagen_barras' => base64_encode($this->generarImagenCodigoBarras($codigoBarras)),
            'imagen_qr' => base64_encode($this->generarImagenQR($codigoQR))
        ];
    }
}