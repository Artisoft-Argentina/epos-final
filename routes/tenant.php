<?php

declare(strict_types=1);

use App\Http\Middleware\BlockInactiveTenant;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
| Las rutas de negocio se cargan desde web.php (sin duplicar código).
| InitializeTenancyByDomain busca el dominio completo (ej: empresa1.epos.test)
| en la tabla domains, y cambia la conexión a la BD de ese tenant.
| BlockInactiveTenant bloquea el acceso si la empresa está desactivada.
*/

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
    BlockInactiveTenant::class,
])->group(base_path('routes/web.php'));
