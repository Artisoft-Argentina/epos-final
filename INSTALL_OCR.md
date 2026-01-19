# Instalación de OCR para Procesamiento de Imágenes

## Requisitos del Sistema

Para procesar imágenes (fotos de facturas/remitos), necesitas instalar Tesseract OCR en tu sistema.

### macOS
```bash
brew install tesseract
brew install tesseract-lang  # Para soporte de español
```

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-spa  # Para español
```

### Docker
Si usas Docker, agrega esto a tu Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-spa \
    && rm -rf /var/lib/apt/lists/*
```

## Instalación de Dependencias PHP

```bash
composer install
```

Esto instalará automáticamente `thiagoalessio/tesseract_ocr` que ya está en el composer.json.

## Verificación

Para verificar que Tesseract está instalado correctamente:

```bash
tesseract --version
```

Deberías ver algo como:
```
tesseract 5.x.x
```

## Uso

Una vez instalado, el sistema podrá:
- ✅ Procesar PDFs (como antes)
- ✅ Procesar fotos tomadas con la cámara
- ✅ Procesar imágenes subidas (JPG, PNG)
- ✅ Extraer texto automáticamente con OCR
- ✅ Actualizar inventario desde cualquier formato
