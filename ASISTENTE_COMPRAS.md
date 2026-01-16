# Asistente de Compras - Procesamiento de PDF con IA

## Instalación

1. Instalar la dependencia de PHP para parsear PDFs:
```bash
composer install
```

2. Asegurarse de que Ollama esté corriendo:
```bash
# Verificar que Ollama esté activo
curl http://localhost:11434/api/tags

# Si no está corriendo, iniciarlo
ollama serve
```

## Cómo funciona

### Flujo de procesamiento:

1. **Usuario sube PDF** → La interfaz permite subir archivos PDF (máx 10MB)

2. **Extracción de texto** → El servicio `PdfProcessorService` usa `smalot/pdfparser` para extraer el texto del PDF

3. **Procesamiento con IA** → El texto extraído se envía a Ollama con un prompt específico que solicita:
   - Identificar tipo de documento (factura/remito)
   - Extraer datos del proveedor (nombre, CUIT, dirección)
   - Extraer items (código, descripción, cantidad, precios)
   - Calcular totales (subtotal, IVA, total)

4. **Respuesta JSON** → Ollama devuelve un JSON estructurado con toda la información

5. **Visualización** → La interfaz muestra los datos extraídos de forma organizada

## Estructura del JSON generado

```json
{
  "tipo_documento": "factura|remito",
  "numero": "0001-00001234",
  "fecha": "2024-01-15",
  "proveedor": {
    "nombre": "Proveedor SA",
    "cuit": "20-12345678-9",
    "direccion": "Calle Falsa 123",
    "telefono": "011-1234-5678"
  },
  "items": [
    {
      "codigo": "ART001",
      "descripcion": "Producto ejemplo",
      "cantidad": 10,
      "precio_unitario": 100.00,
      "subtotal": 1000.00
    }
  ],
  "subtotal": 1000.00,
  "iva": 210.00,
  "total": 1210.00
}
```

## Archivos creados

### Backend
- `app/Services/PdfProcessorService.php` - Servicio para extraer y procesar PDFs
- `app/Http/Controllers/AsistenteComprasController.php` - Controlador con endpoints

### Frontend
- `resources/js/pages/AsistenteCompras/Index.tsx` - Interfaz de usuario

### Rutas
- `GET /asistente-compras` - Página principal
- `POST /asistente-compras/process` - Procesar PDF

## Próximos pasos (opcional)

1. **Guardar en base de datos**: Agregar funcionalidad para crear automáticamente:
   - Proveedor (si no existe)
   - Compra con sus detalles
   - Actualizar inventario

2. **Validación de datos**: Verificar que los datos extraídos sean correctos antes de guardar

3. **Corrección manual**: Permitir editar los datos extraídos antes de confirmar

4. **OCR mejorado**: Para PDFs escaneados, integrar Tesseract OCR

5. **Historial**: Guardar registro de PDFs procesados

## Troubleshooting

### Error: "No se pudo extraer texto del PDF"
- El PDF puede estar protegido o ser una imagen escaneada
- Solución: Usar OCR (Tesseract) para PDFs escaneados

### Error: "Error al procesar con IA"
- Verificar que Ollama esté corriendo: `curl http://localhost:11434/api/tags`
- Verificar que el modelo esté descargado: `ollama list`
- Si no está, descargarlo: `ollama pull qwen2.5:7b`

### Respuesta JSON inválida
- El modelo puede necesitar más contexto o ejemplos
- Ajustar el prompt en `PdfProcessorService::buildPrompt()`
