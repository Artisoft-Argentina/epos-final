<?php

namespace App\Http\Middleware;

use App\Models\PointOfSale;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => tenancy()->initialized
                    ? $request->user()?->load('role')
                    : $request->user('central'),
                'tour_completed' => tenancy()->initialized
                    ? ($request->user()?->tour_completed ?? true)
                    : true,
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy())->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'pointsOfSale' => fn () => tenancy()->initialized
                ? PointOfSale::active()->with('warehouse:id,name')->orderBy('name')->get(['id', 'name', 'pos_number', 'warehouse_id'])
                : [],
            'activePointOfSaleId' => fn () => tenancy()->initialized
                ? (session('active_point_of_sale_id') ?? PointOfSale::where('is_default', true)->value('id'))
                : null,
        ];
    }
}
