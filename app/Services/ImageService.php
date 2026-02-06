<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class ImageService
{
    // Tamaño máximo para imagen principal (ecommerce)
    const MAIN_MAX_WIDTH = 800;
    const MAIN_MAX_HEIGHT = 800;

    // Tamaño para thumbnail
    const THUMB_WIDTH = 300;
    const THUMB_HEIGHT = 300;

    /**
     * Procesa una imagen: redimensiona y crea thumbnail
     */
    public function processArticuloImage(UploadedFile $file, int $articuloId, int $index): array
    {
        $extension = $file->getClientOriginalExtension();
        $timestamp = time();

        // Nombres de archivo
        $nombreArchivo = "{$timestamp}_{$index}.{$extension}";
        $nombreThumb = "{$timestamp}_{$index}_thumb.{$extension}";

        // Directorio
        $directorio = "articulos/{$articuloId}";

        // Procesar imagen principal
        $imagenPrincipal = Image::read($file->getRealPath());
        $imagenPrincipal->scaleDown(self::MAIN_MAX_WIDTH, self::MAIN_MAX_HEIGHT);

        // Guardar imagen principal
        $rutaPrincipal = "{$directorio}/{$nombreArchivo}";
        Storage::disk('public')->put($rutaPrincipal, $imagenPrincipal->toJpeg(85));

        // Crear y guardar thumbnail
        $thumbnail = Image::read($file->getRealPath());
        $thumbnail->cover(self::THUMB_WIDTH, self::THUMB_HEIGHT);

        $rutaThumb = "{$directorio}/{$nombreThumb}";
        Storage::disk('public')->put($rutaThumb, $thumbnail->toJpeg(80));

        return [
            'nombre_archivo' => $nombreArchivo,
            'ruta' => $rutaPrincipal,
            'ruta_thumb' => $rutaThumb,
        ];
    }

    /**
     * Elimina imagen y su thumbnail
     */
    public function deleteArticuloImage(string $ruta, ?string $rutaThumb = null): void
    {
        Storage::disk('public')->delete($ruta);

        if ($rutaThumb) {
            Storage::disk('public')->delete($rutaThumb);
        }
    }
}
