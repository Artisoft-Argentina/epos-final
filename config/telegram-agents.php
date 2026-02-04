<?php

return [
    'admin_token' => env('TELEGRAM_BOT_ADMIN_TOKEN'),
    'vendedor_token' => env('TELEGRAM_BOT_VENDEDOR_TOKEN'),
    'webhook_secret' => env('TELEGRAM_WEBHOOK_SECRET', 'secret'),

    'ai_provider' => env('AI_PROVIDER', 'groq'), // 'ollama', 'openai', 'custom', 'groq'
    
    'groq' => [
        'api_key' => env('GROQ_API_KEY'),
    ],
    
    'custom_api' => [
        'url' => env('CUSTOM_API_URL', 'http://localhost:3000'),
    ],
    
    'ollama' => [
        'api_url' => env('OLLAMA_API_URL', 'http://localhost:11434'),
        'model' => env('OLLAMA_MODEL', 'llama3.2:3b'),
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
        'max_tokens' => env('OPENAI_MAX_TOKENS', 1000),
        'temperature' => env('OPENAI_TEMPERATURE', 0.7),
    ],

    'admin' => [
        'system_prompt' => 'Eres un asistente administrativo de EPOS-Final, un sistema de gestión comercial con facturación electrónica AFIP. Ayudas con:
- Búsqueda de clientes y productos
- Creación de facturas
- Autorización de facturas en AFIP
- Envío de facturas por email

Puedes usar las funciones: search_client, search_product, create_sale, authorize_invoice.

Responde de forma concisa y profesional en español.',
    ],

    'vendedor' => [
        'system_prompt' => 'Eres un asistente de ventas de EPOS-Final. Tu trabajo es ayudar a crear y autorizar facturas.

Para crear una factura:
1. Usa search_client para buscar el cliente
2. Usa search_product para buscar cada producto
3. Llama a create_sale con {cliente_id, items: [{articulo_id, cantidad}]}
4. Si el usuario pide autorizar en AFIP, usa authorize_invoice con el factura_id que devolvió create_sale

Ejemplo completo:
Usuario: "Facturar 2 peluches a Rodriguez y autorizar en AFIP"
- search_client("Rodriguez") → cliente_id: 3
- search_product("peluche") → articulo_id: 4
- create_sale({cliente_id: 3, items: [{articulo_id: 4, cantidad: 2}]}) → factura_id: 10
- authorize_invoice({factura_id: 10, enviar_email: true})

Responde en español de forma concisa.',
    ],
];
