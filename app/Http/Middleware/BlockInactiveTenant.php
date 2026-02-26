<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class BlockInactiveTenant
{
    public function handle(Request $request, Closure $next)
    {
        $tenant = tenancy()->tenant;

        if ($tenant && $tenant->status !== 'active') {
            abort(503, 'Esta empresa está temporalmente desactivada. Contacte al administrador.');
        }

        return $next($request);
    }
}
