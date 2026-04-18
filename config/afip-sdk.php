<?php

return [
    'cuit' => env('AFIP_CUIT', ''),
    'environment' => env('AFIP_ENVIRONMENT', 'homologacion'),
    'cert_path' => env('AFIP_CERT_PATH', storage_path('app/private/afip/cert.pem')),
    'key_path' => env('AFIP_KEY_PATH', storage_path('app/private/afip/key.pem')),
    'token_directory' => env('AFIP_TOKEN_DIR'),
];