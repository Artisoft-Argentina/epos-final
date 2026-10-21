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

        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user?->loadMissing(['roles']),
                'tour_completed' => $user?->tour_completed ?? true,
                'permissions' => fn () => $user?->getAllPermissions()->pluck('name')->toArray() ?? [],
                'roles' => fn () => $user?->roles->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])->toArray() ?? [],
                'is_vendedor' => fn () => $user?->isVendedor() ?? false,
                'is_admin' => fn () => $user?->isAdmin() ?? false,
                'is_superadmin' => fn () => $user?->hasRole('superadmin') ?? false,
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
            'pointsOfSale' => fn () => $this->resolvePointsOfSaleProp($request),
            'activePointOfSaleId' => fn () => $this->resolveActivePointOfSaleId($request),
        ];
    }

    private function resolvePointsOfSaleProp(Request $request)
    {
        $user = $request->user();
        if ($user && $user->isVendedor()) {
            // Vendedor: solo su PV asignado (si tiene)
            return $user->point_of_sale_id
                ? PointOfSale::active()->with('warehouse:id,name')->where('id', $user->point_of_sale_id)->get(['id', 'name', 'pos_number', 'warehouse_id'])
                : collect();
        }

        return PointOfSale::active()->with('warehouse:id,name')->orderBy('name')->get(['id', 'name', 'pos_number', 'warehouse_id']);
    }

    private function resolveActivePointOfSaleId(Request $request): ?int
    {
        $user = $request->user();
        if ($user && $user->isVendedor()) {
            return $user->point_of_sale_id;
        }

        return session('active_point_of_sale_id') ?? PointOfSale::where('is_default', true)->value('id');
    }
}
