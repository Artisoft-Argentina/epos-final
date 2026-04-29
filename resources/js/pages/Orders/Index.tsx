import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Plus, Eye, SquarePen } from 'lucide-react';

interface Order {
    id: number;
    pos_number: number;
    order_number: number;
    date: string;
    total: number;
    supplier: { id: number; business_name: string };
    products: { id: number }[];
}

interface Props { orders: Order[]; }

export default function Index({ orders }: Props) {
    const columns: Column<Order>[] = [
        {
            key: 'order_number',
            header: 'Orden',
            render: (row) => (
                <span className="font-medium tabular-nums text-foreground">
                    {row.pos_number.toString().padStart(4, '0')}-{row.order_number.toString().padStart(8, '0')}
                </span>
            ),
        },
        {
            key: 'supplier',
            header: 'Proveedor',
            render: (row) => <span className="text-foreground">{row.supplier?.business_name}</span>,
        },
        {
            key: 'date',
            header: 'Fecha',
            render: (row) => <span className="text-muted-foreground">{new Date(row.date).toLocaleDateString('es-AR')}</span>,
        },
        {
            key: 'products',
            header: 'Artículos',
            render: (row) => <span className="text-muted-foreground">{row.products?.length ?? 0}</span>,
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            render: (row) => (
                <span className="font-semibold tabular-nums text-foreground">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(row.total)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Link href={route('orders.show', row.id)}>
                        <Button variant="outline" size="icon" className="size-8" title="Ver"><Eye className="size-3.5" /></Button>
                    </Link>
                    <Link href={route('orders.edit', row.id)}>
                        <Button variant="outline" size="icon" className="size-8" title="Editar"><SquarePen className="size-3.5" /></Button>
                    </Link>
                    <DeleteConfirmationDialog
                        url={route('orders.destroy', row.id)}
                        title="Eliminar Orden"
                        description="¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer."
                    />
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Órdenes de Compra" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Órdenes de Compra"
                    actions={
                        <Link href={route('orders.create')}>
                            <Button><Plus className="size-4" /> Nueva Orden</Button>
                        </Link>
                    }
                />
                <DataTable columns={columns} data={orders} keyExtractor={(row) => row.id} emptyMessage="No hay órdenes registradas." />
            </div>
        </AppLayout>
    );
}
