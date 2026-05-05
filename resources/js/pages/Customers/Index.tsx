import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/data-table';
import { ActionButton } from '@/components/action-button';
import { Pagination } from '@/components/pagination';
import { Plus, Search, FileText, Edit, Power, Users, UserCheck, UserPlus } from 'lucide-react';
import { useState, useRef } from 'react';

interface Customer {
    id: number;
    business_name: string;
    fantasy_name: string | null;
    person_type: string;
    tax_id: string | null;
    dni: string | null;
    email: string | null;
    phone: string | null;
    cellphone: string | null;
    tax_status: string;
    active: boolean;
}

interface Props {
    customers: {
        data: Customer[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        active?: string;
        tax_status?: string;
    };
    kpis: {
        total: number;
        active: number;
        new_month: number;
    };
}

const TAX_STATUS_OPTIONS = [
    { value: 'Responsable Inscripto', label: 'Responsable Inscripto' },
    { value: 'Monotributo', label: 'Monotributo' },
    { value: 'Exento', label: 'Exento' },
    { value: 'Consumidor Final', label: 'Consumidor Final' },
];

export default function Index({ customers, filters, kpis }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const timeoutRef = useRef<NodeJS.Timeout>();

    const applyFilter = (params: Record<string, string>) => {
        router.get(route('customers.index'), { ...filters, ...params }, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => applyFilter({ search: value }), 300);
    };

    const handleToggleActive = (customer: Customer) => {
        router.patch(route('customers.toggle-active', customer.id));
    };

    const columns: Column<Customer>[] = [
        {
            key: 'business_name',
            header: 'Cliente',
            render: (row) => {
                const initials = row.business_name
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase();
                return (
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                            {initials}
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{row.business_name}</p>
                            {row.fantasy_name && (
                                <p className="text-xs text-muted-foreground">{row.fantasy_name}</p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'document',
            header: 'DNI / CUIT',
            render: (row) => (
                <div className="text-sm tabular-nums space-y-0.5">
                    {row.tax_id && <p className="text-foreground">{row.tax_id}</p>}
                    {row.dni && <p className="text-foreground">{row.dni}</p>}
                    {!row.tax_id && !row.dni && <span className="text-muted-foreground">—</span>}
                </div>
            ),
        },
        {
            key: 'contact',
            header: 'Contacto',
            render: (row) => (
                <div className="text-sm">
                    {row.email && <p className="text-foreground">{row.email}</p>}
                    {row.phone && <p className="text-muted-foreground">{row.phone}</p>}
                    {row.cellphone && !row.phone && <p className="text-muted-foreground">{row.cellphone}</p>}
                    {!row.email && !row.phone && !row.cellphone && <span className="text-muted-foreground">—</span>}
                </div>
            ),
        },
        {
            key: 'tax_status',
            header: 'Condición IVA',
            render: (row) => (
                <Badge variant="secondary">{row.tax_status}</Badge>
            ),
        },
        {
            key: 'active',
            header: 'Estado',
            render: (row) => (
                <Badge variant={row.active ? 'success' : 'secondary'} dot>
                    {row.active ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Link href={route('customers.account-statement', row.id)}>
                        <ActionButton title="Estado de Cuenta">
                            <FileText className="size-3.5" />
                        </ActionButton>
                    </Link>
                    <Link href={route('customers.edit', row.id)}>
                        <ActionButton title="Editar">
                            <Edit className="size-3.5" />
                        </ActionButton>
                    </Link>
                    <ActionButton
                        title={row.active ? 'Desactivar' : 'Activar'}
                        onClick={() => handleToggleActive(row)}
                        variant={row.active ? 'destructive-soft' : 'outline'}
                    >
                        <Power className="size-3.5" />
                    </ActionButton>
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Clientes" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Clientes"
                    description="Gestioná tu cartera de clientes"
                    actions={
                        <Link href={route('customers.create')}>
                            <Button><Plus className="size-4" /> Nuevo Cliente</Button>
                        </Link>
                    }
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Clientes', value: kpis.total, icon: Users, sub: 'clientes registrados' },
                        { label: 'Clientes Activos', value: kpis.active, icon: UserCheck, sub: 'habilitados para operar' },
                        { label: 'Nuevos este mes', value: kpis.new_month, icon: UserPlus, sub: 'altas en el mes actual' },
                    ].map((kpi) => (
                        <Card key={kpi.label} className="gap-0 py-0">
                            <CardContent className="px-4 py-4 flex flex-col gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-full bg-primary/5 flex items-center justify-center">
                                        <kpi.icon className="size-4 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{kpi.label}</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{kpi.value}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full sm:max-w-sm">
                        <Input
                            startIcon={<Search className="size-4" />}
                            placeholder="Buscar por nombre, documento, email..."
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                    <Select
                        value={filters.active ?? 'all'}
                        onValueChange={(v) => applyFilter({ active: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="1">Activo</SelectItem>
                            <SelectItem value="0">Inactivo</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.tax_status ?? 'all'}
                        onValueChange={(v) => applyFilter({ tax_status: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-full sm:w-52">
                            <SelectValue placeholder="Condición IVA" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las condiciones</SelectItem>
                            {TAX_STATUS_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    data={customers.data}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No se encontraron clientes."
                    footer={
                        <p className="text-sm text-muted-foreground">
                            {customers.meta?.total ?? customers.data.length} resultados
                        </p>
                    }
                />

                <Pagination links={customers.links} />
            </div>
        </AppLayout>
    );
}
