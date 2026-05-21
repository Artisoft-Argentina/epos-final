import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActionButton } from '@/components/action-button';
import { Pagination } from '@/components/pagination';
import { Plus, Eye, ShoppingCart, Search } from 'lucide-react';
import { useState } from 'react';

interface Presupuesto {
    id: number;
    quote_number: number;
    date: string;
    total: number;
    customer: { business_name: string; fantasy_name?: string | null };
    user: { name: string };
}

interface Props { presupuestos: { data: Presupuesto[]; links: any; meta: any }; }

export default function Index({ presupuestos }: Props) {
    const page = usePage<any>();
    const [search, setSearch] = useState('');

    const filtered = presupuestos.data.filter((p) =>
        (p.customer?.business_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        p.quote_number.toString().includes(search) ||
        p.user.name.toLowerCase().includes(search.toLowerCase())
    );

    const convertirAVenta = (id: number) => {
        if (confirm('¿Convertir este presupuesto en una venta?')) router.post(route('presupuestos.convertir-venta', id));
    };

    const columns: Column<Presupuesto>[] = [
        {
            key: 'quote_number',
            header: 'Presupuesto',
            render: (row) => <span className="font-medium tabular-nums text-foreground">#{row.quote_number}</span>,
        },
        {
            key: 'customer',
            header: 'Cliente',
            render: (row) => <span className="text-foreground">{row.customer?.fantasy_name || row.customer?.business_name || '-'}</span>,
        },
        {
            key: 'date',
            header: 'Fecha',
            render: (row) => <span className="text-muted-foreground">{new Date(row.date).toLocaleDateString('es-AR')}</span>,
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            render: (row) => <span className="font-semibold tabular-nums text-foreground">${Number(row.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>,
        },
        {
            key: 'user',
            header: 'Vendedor',
            render: (row) => <span className="text-muted-foreground">{row.user.name}</span>,
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center gap-1">
                    <ActionButton title="Convertir a venta" onClick={() => convertirAVenta(row.id)}>
                        <ShoppingCart className="size-3.5" />
                    </ActionButton>
                    <Link href={route('presupuestos.show', row.id)}>
                        <ActionButton title="Ver"><Eye className="size-3.5" /></ActionButton>
                    </Link>
                    <DeleteConfirmationDialog url={route('presupuestos.destroy', row.id)} title="Eliminar presupuesto" description={`¿Está seguro que desea eliminar el presupuesto #${row.quote_number}?`} />
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Presupuestos" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Presupuestos"
                    actions={
                        <Link href={route('presupuestos.create')}>
                            <Button><Plus className="size-4" /> Nuevo Presupuesto</Button>
                        </Link>
                    }
                />
                <div className="max-w-sm">
                    <Input startIcon={<Search className="size-4" />} placeholder="Buscar por cliente, número o vendedor..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <DataTable columns={columns} data={filtered} keyExtractor={(row) => row.id} emptyMessage="No se encontraron presupuestos." />
                <Pagination links={presupuestos.links} />
            </div>
        </AppLayout>
    );
}
