<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    private function tenantUrl(string $domain): string
    {
        // $appUrl = config('app.url');
        $appUrl = config('app.url');
        $scheme = parse_url($appUrl, PHP_URL_SCHEME) ?? 'http';
        $port   = parse_url($appUrl, PHP_URL_PORT);

        return $scheme . '://' . $domain . ($port ? ':' . $port : '');
    }

    public function index(): Response
    {
        $tenants = Tenant::with('domains')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // $tenants->getCollection()->transform(function ($tenant) {
        //     $domain = $tenant->domains->first()?->domain;
        //     $tenant->url = $domain ? $this->tenantUrl($domain) : null;
        //     return $tenant;
        // });

        return Inertia::render('central/Tenants/Index', [
            'tenants' => $tenants,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('central/Tenants/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        // $centralDomain = env('CENTRAL_DOMAIN', parse_url(config('app.url'), PHP_URL_HOST));
        $centralDomain = env('SESSION_DOMAIN');
        $subdomain     = $request->slug . $centralDomain;

        $request->validate([
            'razonsocial'    => 'required|string|max:255',
            'cuit'           => 'required|string|max:20',
            'slug'           => ['required', 'string', 'max:63', 'regex:/^[a-z0-9\-]+$/', function ($attr, $value, $fail) use ($subdomain) {
                if (\Illuminate\Support\Facades\DB::table('domains')->where('domain', $subdomain)->exists()) {
                    $fail('Este subdominio ya está en uso.');
                }
            }],
            'plan'           => 'required|in:basic,pro,enterprise',
            'admin_name'     => 'required|string|max:255',
            'admin_email'    => 'required|email|max:255',
            'admin_password' => 'required|string|min:8',
        ]);

        // 1. Crear el tenant (dispara TenantCreated → CreateDatabase + MigrateDatabase)
        $tenant = Tenant::create([
            'razonsocial' => $request->razonsocial,
            'cuit'        => preg_replace('/\D/', '', $request->cuit),
            'plan'        => $request->plan,
            'status'      => 'active',
        ]);

        // 2. Asignar subdominio
        $tenant->domains()->create(['domain' => $subdomain]);

        // 3. Crear roles y primer usuario admin dentro del tenant
        tenancy()->initialize($tenant);

        try {
            $superadminRole = \App\Models\Role::firstOrCreate(['role' => 'superadmin'], ['permission' => '*', 'description' => 'Super Administrador']);
            $adminRole      = \App\Models\Role::firstOrCreate(['role' => 'admin'],      ['permission' => '*', 'description' => 'Administrador']);
            \App\Models\Role::firstOrCreate(['role' => 'vendedor'], ['permission' => '',  'description' => 'Vendedor']);
            \App\Models\Role::firstOrCreate(['role' => 'cliente'],  ['permission' => '',  'description' => 'Cliente']);

            \App\Models\User::create([
                'name'     => $request->admin_name,
                'email'    => $request->admin_email,
                'password' => Hash::make($request->admin_password),
                'role_id'  => $superadminRole->id,
            ]);

            // Pre-poblar configuración de la empresa con los datos del alta
            \App\Models\InitialSetting::create([
                'razonsocial'  => $request->razonsocial,
                'cuit'         => preg_replace('/\D/', '', $request->cuit),
                'puntoventa'   => 1,
                'afip_ambiente' => 'homologacion',
                'numfactura'   => 0,
                'numremito'    => 0,
                'numpresupuesto' => 0,
                'numpago'      => 0,
                'numrecibo'    => 0,
            ]);
        } finally {
            tenancy()->end();
        }

        return redirect()->route('central.tenants.index')
            // ->with('success', "Empresa '{$tenant->razonsocial}' creada correctamente. URL: {$this->tenantUrl($subdomain)}");
            ->with('success', "Empresa '{$tenant->razonsocial}' creada correctamente. URL: {$subdomain}");
    }

    public function show(Tenant $tenant): Response
    {
        $tenant->load('domains');

        // $domain = $tenant->domains->first()?->domain;
        // $tenant->url = $domain ? $this->tenantUrl($domain) : null;

        // Obtener stats del tenant
        $stats = [];
        tenancy()->initialize($tenant);
        try {
            $stats = [
                'users'    => \App\Models\User::count(),
                'clientes' => \App\Models\Cliente::count(),
                'facturas' => \DB::table('facturas')->count(),
                'articulos' => \DB::table('articulos')->count(),
            ];
        } finally {
            tenancy()->end();
        }

        return Inertia::render('central/Tenants/Show', [
            'tenant' => $tenant,
            'stats'  => $stats,
        ]);
    }

    public function edit(Tenant $tenant): Response
    {
        $tenant->load('domains');

        return Inertia::render('central/Tenants/Edit', [
            'tenant' => $tenant,
        ]);
    }

    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $request->validate([
            'razonsocial' => 'required|string|max:255',
            'cuit'        => 'required|string|max:20',
            'plan'        => 'required|in:basic,pro,enterprise',
        ]);

        $tenant->update([
            'razonsocial' => $request->razonsocial,
            'cuit'        => preg_replace('/\D/', '', $request->cuit),
            'plan'        => $request->plan,
        ]);

        // Sincronizar cambios a inicialsettings del tenant
        tenancy()->initialize($tenant);
        try {
            \App\Models\InitialSetting::query()->update([
                'razonsocial' => $request->razonsocial,
                'cuit'        => preg_replace('/\D/', '', $request->cuit),
            ]);
        } finally {
            tenancy()->end();
        }

        return redirect()->route('central.tenants.show', $tenant)
            ->with('success', 'Empresa actualizada correctamente.');
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        $tenant->delete(); // Dispara TenantDeleted → DeleteDatabase

        return redirect()->route('central.tenants.index')
            ->with('success', 'Empresa eliminada correctamente.');
    }

    public function activate(Tenant $tenant): RedirectResponse
    {
        $tenant->update(['status' => 'active']);

        return back()->with('success', "Empresa '{$tenant->razonsocial}' activada.");
    }

    public function deactivate(Tenant $tenant): RedirectResponse
    {
        $tenant->update(['status' => 'inactive']);

        return back()->with('success', "Empresa '{$tenant->razonsocial}' desactivada.");
    }
}
