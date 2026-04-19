<?php

return [
    'resolve_cuit' => null,
    'resolve_environment' => null,
    'resolve_cert_path' => null,
    'resolve_key_path' => null,
    'cert_path' => env('AFIP_CERT_PATH', storage_path('app/private/afip/cert.pem')),
    'key_path' => env('AFIP_KEY_PATH', storage_path('app/private/afip/key.pem')),
    'token_directory' => env('AFIP_TOKEN_DIR'),
];