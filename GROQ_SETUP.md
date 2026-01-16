# Configuración de Groq API (Gratis y Rápido)

## Paso 1: Obtener API Key

1. Ve a: https://console.groq.com/
2. Regístrate con tu email (es gratis)
3. Ve a "API Keys" en el menú lateral
4. Haz clic en "Create API Key"
5. Copia la key generada

## Paso 2: Configurar en Laravel

Agrega la key en tu archivo `.env`:

```bash
GROQ_API_KEY=gsk_tu_api_key_aqui
```

## Paso 3: Listo!

El sistema ahora usará Groq en lugar de Ollama local. Groq es:
- ✅ **Gratis** (con límites generosos)
- ✅ **Muy rápido** (respuestas en 1-2 segundos)
- ✅ **Sin instalación local** necesaria
- ✅ Usa **Llama 3.3 70B** (modelo muy potente)

## Límites gratuitos de Groq:
- 30 requests por minuto
- 6,000 tokens por minuto
- Más que suficiente para desarrollo

## Alternativas si necesitas más:

### OpenAI (tiene créditos gratis al registrarte)
```bash
OPENAI_API_KEY=sk-...
```

Cambiar en `PdfProcessorService.php`:
```php
'base_uri' => 'https://api.openai.com/v1/',
'model' => 'gpt-4o-mini', // Más barato
```

### Anthropic Claude (también tiene créditos gratis)
```bash
ANTHROPIC_API_KEY=sk-ant-...
```
