<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Request as SymfonyRequest;

class HandleTrustProxies
{
    /**
     * The trusted proxies for this application.
     *
     * @var int|string|null
     */
    protected static $trustedProxies = '*';

    /**
     * The headers that should be used to detect proxies.
     *
     * @var int
     */
    protected static $trustedHeaders = Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_HOST | Request::HEADER_X_FORWARDED_PROTO | Request::HEADER_X_FORWARDED_PORT;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        $request->setTrustedProxies(static::$trustedProxies, static::$trustedHeaders);
        $request->setTrustedHosts([$request->getHost()]);

        return $next($request);
    }
}