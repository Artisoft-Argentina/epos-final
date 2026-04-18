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
    public function processProductImage(UploadedFile $file, int $productId, int $index): array
    {
        $extension = $file->getClientOriginalExtension();
        $timestamp = time();

        $filename      = "{$timestamp}_{$index}.{$extension}";
        $thumbFilename = "{$timestamp}_{$index}_thumb.{$extension}";
        $directory     = "products/{$productId}";

        $main = Image::read($file->getRealPath());
        $main->scaleDown(self::MAIN_MAX_WIDTH, self::MAIN_MAX_HEIGHT);
        $path = "{$directory}/{$filename}";
        Storage::disk('public')->put($path, $main->toJpeg(85));

        $thumb = Image::read($file->getRealPath());
        $thumb->cover(self::THUMB_WIDTH, self::THUMB_HEIGHT);
        $thumbPath = "{$directory}/{$thumbFilename}";
        Storage::disk('public')->put($thumbPath, $thumb->toJpeg(80));

        return [
            'filename'       => $filename,
            'path'           => $path,
            'thumbnail_path' => $thumbPath,
        ];
    }

    public function deleteProductImage(string $path, ?string $thumbnailPath = null): void
    {
        Storage::disk('public')->delete($path);
        if ($thumbnailPath) {
            Storage::disk('public')->delete($thumbnailPath);
        }
    }
}
