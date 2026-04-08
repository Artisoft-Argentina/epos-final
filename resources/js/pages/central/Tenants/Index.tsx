import CentralLayout from '@/layouts/central-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, PowerOff, Power, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Domain {
    domain: string;
}

interface Tenant {
    id: string;
    razonsocial: string;
    cuit: string;
    plan: string;
    status: string;
    created_at: string;
    domains: Domain[];
    url: string | null;
}

interface Props {
    tenants: {
        data: Tenant[];
        links: any[];
        meta: any;
    };
}

const planLabel: Record<string, string> = {
    basic: 'Básico',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

export default function TenantsIndex({ tenants }: Props) {
    const handleActivate = (tenant: Tenant) => {
        router.post(route('central.tenants.activate', tenant.id));
    };

    const handleDeactivate = (tenant: Tenant) => {
        router.post(route('central.tenants.deactivate', tenant.id));
    };

    const handleDelete = (tenant: Tenant) => {
        if (confirm(`¿Eliminar la empresa "${tenant.razonsocial}" y toda su base de datos? Esta acción es irreversible.`)) {
            router.delete(route('central.tenants.destroy', tenant.id));
        }
    };

    return (
        <CentralLayout title="Empresas">
            <Head title="Empresas — Panel Central" />

            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tenants.meta?.total ?? tenants.data.length} empresa(s) registrada(s)
                </p>
                <Link href={route('central.tenants.create')}>
                    <Button>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Nueva empresa
                    </Button>
                </Link>
            </div>

            <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-gray-900">
                <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Empresa</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">CUIT</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">URL</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Plan</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Estado</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                        {tenants.data.map((tenant) => {
                            const domain = tenant.domains[0]?.domain ?? '';
                            return (
                                <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                        {tenant.razonsocial}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{tenant.cuit}</td>
                                    <td className="px-4 py-3">
                                        {tenant.url && (
                                            <a
                                                href={tenant.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                {domain}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                        {planLabel[tenant.plan] ?? tenant.plan}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                            tenant.status === 'active'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                        }`}>
                                            {tenant.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={route('central.tenants.show', tenant.id)}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            {tenant.status === 'active' ? (
                                                <Button variant="ghost" size="sm" onClick={() => handleDeactivate(tenant)}>
                                                    <PowerOff className="h-4 w-4 text-yellow-600" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" onClick={() => handleActivate(tenant)}>
                                                    <Power className="h-4 w-4 text-green-600" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(tenant)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {tenants.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                    No hay empresas registradas. <Link href={route('central.tenants.create')} className="text-blue-600 hover:underline">Crear la primera</Link>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </CentralLayout>
    );
}
