<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class ImageService
{
    const MAIN_MAX   = 1200;
    const MEDIUM_MAX = 600;
    const THUMB_MAX  = 200;

    const MAIN_QUALITY   = 80;
    const MEDIUM_QUALITY = 75;
    const THUMB_QUALITY  = 70;

    /**
     * Procesa una imagen de producto: genera 3 variantes en WebP sin recorte.
     */
    public function processProductImage(UploadedFile $file, int $productId, int $index): array
    {
        $timestamp = time();
        $directory = "products/{$productId}";

        $mainName   = "{$timestamp}_{$index}.webp";
        $mediumName = "{$timestamp}_{$index}_md.webp";
        $thumbName  = "{$timestamp}_{$index}_thumb.webp";

        $original = Image::read($file->getRealPath());

        $main = clone $original;
        $main->scaleDown(self::MAIN_MAX, self::MAIN_MAX);
        Storage::disk('public')->put("{$directory}/{$mainName}", $main->toWebp(self::MAIN_QUALITY));

        $medium = clone $original;
        $medium->scaleDown(self::MEDIUM_MAX, self::MEDIUM_MAX);
        Storage::disk('public')->put("{$directory}/{$mediumName}", $medium->toWebp(self::MEDIUM_QUALITY));

        $thumb = clone $original;
        $thumb->scaleDown(self::THUMB_MAX, self::THUMB_MAX);
        Storage::disk('public')->put("{$directory}/{$thumbName}", $thumb->toWebp(self::THUMB_QUALITY));

        return [
            'filename'       => $mainName,
            'path'           => "{$directory}/{$mainName}",
            'medium_path'    => "{$directory}/{$mediumName}",
            'thumbnail_path' => "{$directory}/{$thumbName}",
        ];
    }

    public function deleteProductImage(string $path, ?string $mediumPath = null, ?string $thumbnailPath = null): void
    {
        Storage::disk('public')->delete($path);

        if ($mediumPath) {
            Storage::disk('public')->delete($mediumPath);
        }

        if ($thumbnailPath) {
            Storage::disk('public')->delete($thumbnailPath);
        }
    }
}
