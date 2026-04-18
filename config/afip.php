<?php

return [
    'cuit' => env('AFIP_CUIT', '20349590418'),
    'environment' => env('AFIP_ENVIRONMENT', 'homologacion'),
    'certificate_path' => env('AFIP_CERTIFICATE_PATH', storage_path('app/private/afip/cert.pem')),
    'key_path' => env('AFIP_KEY_PATH', storage_path('app/private/afip/key.pem')),
];