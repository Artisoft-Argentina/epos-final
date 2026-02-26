import CentralLayout from '@/layouts/central-layout';
import { Head } from '@inertiajs/react';
import { Building2, CheckCircle, XCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Props {
    stats: {
        total_tenants: number;
        active_tenants: number;
        inactive_tenants: number;
    };
}

export default function CentralDashboard({ stats }: Props) {
    return (
        <CentralLayout title="Dashboard">
            <Head title="Panel Central" />

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    icon={<Building2 className="h-6 w-6 text-blue-600" />}
                    label="Total Empresas"
                    value={stats.total_tenants}
                    bg="bg-blue-50 dark:bg-blue-900/20"
                />
                <StatCard
                    icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                    label="Empresas Activas"
                    value={stats.active_tenants}
                    bg="bg-green-50 dark:bg-green-900/20"
                />
                <StatCard
                    icon={<XCircle className="h-6 w-6 text-red-500" />}
                    label="Empresas Inactivas"
                    value={stats.inactive_tenants}
                    bg="bg-red-50 dark:bg-red-900/20"
                />
            </div>

            <div className="mt-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Acciones rápidas</h2>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                        href={route('central.tenants.index')}
                        className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Ver todas las empresas →
                    </Link>
                    <Link
                        href={route('central.tenants.create')}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                    >
                        + Nueva empresa
                    </Link>
                </div>
            </div>
        </CentralLayout>
    );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
    return (
        <div className={`rounded-xl border p-5 ${bg}`}>
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800">{icon}</div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
}
