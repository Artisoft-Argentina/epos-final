import CentralLayout from '@/layouts/central-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowLeft, Power, PowerOff, Pencil } from 'lucide-react';

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
}

interface Stats {
    users: number;
    clientes: number;
    facturas: number;
    articulos: number;
}

interface Props {
    tenant: Tenant;
    stats: Stats;
}

const planLabel: Record<string, string> = {
    basic: 'Básico',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

export default function ShowTenant({ tenant, stats }: Props) {
    const domain = tenant.domains[0]?.domain ?? '';

    const handleToggle = () => {
        if (tenant.status === 'active') {
            router.post(route('central.tenants.deactivate', tenant.id));
        } else {
            router.post(route('central.tenants.activate', tenant.id));
        }
    };

    return (
        <CentralLayout title={tenant.razonsocial}>
            <Head title={`${tenant.razonsocial} — Panel Central`} />

            <div className="mb-6 flex items-center gap-4">
                <Link href={route('central.tenants.index')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-3 ml-auto">
                    <Link href={route('central.tenants.edit', tenant.id)}>
                        <Button variant="outline" size="sm">
                            <Pencil className="mr-1.5 h-4 w-4" />
                            Editar
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggle}
                        className={tenant.status === 'active' ? 'text-yellow-600' : 'text-green-600'}
                    >
                        {tenant.status === 'active'
                            ? <><PowerOff className="mr-1.5 h-4 w-4" /> Desactivar</>
                            : <><Power className="mr-1.5 h-4 w-4" /> Activar</>
                        }
                    </Button>
                    {domain && (
                        <a href={`https://${domain}`} target="_blank" rel="noreferrer">
                            <Button size="sm">
                                <ExternalLink className="mr-1.5 h-4 w-4" />
                                Abrir sistema
                            </Button>
                        </a>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Datos principales */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900">
                        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Información de la empresa</h2>
                        <dl className="space-y-3 text-sm">
                            <DataRow label="Razón Social" value={tenant.razonsocial} />
                            <DataRow label="CUIT" value={tenant.cuit} />
                            <DataRow label="Plan" value={planLabel[tenant.plan] ?? tenant.plan} />
                            <DataRow
                                label="Estado"
                                value={
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                        tenant.status === 'active'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                    }`}>
                                        {tenant.status === 'active' ? 'Activo' : 'Inactivo'}
                                    </span>
                                }
                            />
                            <DataRow
                                label="URL"
                                value={
                                    domain
                                        ? <a href={`https://${domain}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
                                            {domain} <ExternalLink className="h-3 w-3" />
                                          </a>
                                        : '—'
                                }
                            />
                            <DataRow label="Creada" value={new Date(tenant.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} />
                        </dl>
                    </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                    {[
                        { label: 'Usuarios', value: stats.users },
                        { label: 'Clientes', value: stats.clientes },
                        { label: 'Facturas', value: stats.facturas },
                        { label: 'Artículos', value: stats.articulos },
                    ].map((s) => (
                        <div key={s.label} className="rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-900">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </CentralLayout>
    );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="font-medium text-gray-900 dark:text-white">{value}</dd>
        </div>
    );
}
