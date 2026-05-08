import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { Pagination } from '@/components/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, ArrowLeftRight } from 'lucide-react';

interface Warehouse {
    id: number;
    name: string;
}

interface Transfer {
    id: number;
    transfer_number: number;
    date: string;
    status: 'draft' | 'in_transit' | 'received' | 'cancelled';
    origin_warehouse: Warehouse;
    destination_warehouse: Warehouse;
    requested_by: { id: number; name: string };
}

interface Props {
    transfers: { data: Transfer[]; links: any };
    warehouses: Warehouse[];
    filters: { status?: string; warehouse_id?: string };
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    draft: { label: 'Borrador', variant: 'secondary' },
    in_transit: { label: 'En tránsito', variant: 'default' },
    received: { label: 'Recibida', variant: 'outline' },
    cancelled: { label: 'Cancelada', variant: 'destructive' },
};

export default function Index({ transfers, warehouses, filters }: Props) {
    const applyFilter = (key: string, value: string) => {
        router.get(route('transferencias.index'), { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    const columns: Column<Transfer>[] = [
        {
            key: 'transfer_number',
            header: '#',
            render: (row) => <span className="font-mono text-xs">T-{String(row.transfer_number).padStart(5, '0')}</span>,
        },
        { key: 'date', header: 'Fecha', render: (row) => row.date },
        {
            key: 'route',
            header: 'Origen → Destino',
            render: (row) => (
                <div className="flex items-center gap-1 text-sm">
                    <span>{row.origin_warehouse?.name}</span>
                    <ArrowLeftRight className="size-3 text-muted-foreground" />
                    <span>{row.destination_warehouse?.name}</span>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Estado',
            render: (row) => {
                const s = statusLabels[row.status];
                return <Badge variant={s?.variant}>{s?.label ?? row.status}</Badge>;
            },
        },
        {
            key: 'requested_by',
            header: 'Solicitado por',
            render: (row) => row.requested_by?.name ?? '-',
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row) => (
                <Link href={route('transferencias.show', row.id)}>
                    <Button variant="ghost" size="sm"><Eye className="size-4" /></Button>
                </Link>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Transferencias" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Transferencias entre Almacenes"
                    description="Movimiento de mercadería entre depósitos."
                    actions={
                        <Link href={route('transferencias.create')}>
                            <Button><Plus className="size-4" /> Nueva Transferencia</Button>
                        </Link>
                    }
                />
                <div className="flex gap-3">
                    <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter('status', v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Todos</SelectItem>
                            <SelectItem value="draft">Borrador</SelectItem>
                            <SelectItem value="in_transit">En tránsito</SelectItem>
                            <SelectItem value="received">Recibida</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.warehouse_id ?? ''} onValueChange={(v) => applyFilter('warehouse_id', v)}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Almacén" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Todos</SelectItem>
                            {warehouses.map((w) => (
                                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DataTable
                    columns={columns}
                    data={transfers.data}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No hay transferencias registradas."
                />
                <Pagination links={transfers.links} />
            </div>
        </AppLayout>
    );
}
