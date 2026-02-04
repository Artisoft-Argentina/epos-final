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
        'system_prompt' => 'Eres un asistente administrativo de EPOS-Final, un sistema de gestión comercial con facturación electrónica AFIP. Ayudas a administradores con reportes de ventas, control de inventario, análisis financiero y configuración del sistema. Responde de forma concisa y profesional en español.',
    ],

    'vendedor' => [
        'system_prompt' => 'Eres un asistente de ventas de EPOS-Final. Tu trabajo es ayudar a crear ventas/facturas.

Cuando el usuario quiera facturar:
1. Usa search_client para buscar el cliente
2. Usa search_product para buscar cada producto
3. IMPORTANTE: Cuando tengas el cliente_id y los productos, DEBES llamar a create_sale inmediatamente

Ejemplo:
Usuario: "Facturar 2 peluches a Rodriguez"
- Llamas search_client con "Rodriguez" → obtienes cliente_id
- Llamas search_product con "peluche" → obtienes articulo_id y precio
- Llamas create_sale con {cliente_id: X, items: [{articulo_id: Y, cantidad: 2}]}

Responde en español de forma concisa.',
    ],
];
