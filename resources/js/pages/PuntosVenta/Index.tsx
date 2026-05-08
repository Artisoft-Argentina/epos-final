import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActionButton } from '@/components/action-button';
import { Pagination } from '@/components/pagination';
import { Plus, Edit, Store } from 'lucide-react';

interface Warehouse {
    id: number;
    name: string;
}

interface PuntoVenta {
    id: number;
    name: string;
    pos_number: number;
    warehouse_id: number;
    warehouse: Warehouse;
    voucher_letter_default: string;
    next_invoice_number_a: number;
    next_invoice_number_b: number;
    next_invoice_number_c: number;
    is_default: boolean;
    active: boolean;
}

interface Props {
    puntosVenta: { data: PuntoVenta[]; links: any; meta: any };
}

export default function Index({ puntosVenta }: Props) {
    const columns: Column<PuntoVenta>[] = [
        {
            key: 'name',
            header: 'Punto de Venta',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Store className="size-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{row.name}</span>
                    {row.is_default && <Badge variant="secondary">Default</Badge>}
                    {!row.active && <Badge variant="outline">Inactivo</Badge>}
                </div>
            ),
        },
        {
            key: 'pos_number',
            header: 'Nº PV',
            render: (row) => <span className="font-mono text-xs">{String(row.pos_number).padStart(4, '0')}</span>,
        },
        {
            key: 'warehouse',
            header: 'Almacén',
            render: (row) => row.warehouse?.name ?? '-',
        },
        {
            key: 'voucher_letter_default',
            header: 'Letra',
            render: (row) => <Badge variant="outline">{row.voucher_letter_default}</Badge>,
        },
        {
            key: 'next_numbers',
            header: 'Próx. Nº (A/B/C)',
            render: (row) => (
                <span className="font-mono text-xs">
                    {row.next_invoice_number_a} / {row.next_invoice_number_b} / {row.next_invoice_number_c}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Link href={route('puntos-venta.edit', row.id)}>
                        <ActionButton title="Editar"><Edit className="size-3.5" /></ActionButton>
                    </Link>
                    {!row.is_default && (
                        <DeleteConfirmationDialog
                            url={route('puntos-venta.destroy', row.id)}
                            title="Eliminar punto de venta"
                            description={`¿Seguro que deseas eliminar el punto de venta ${row.name}?`}
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Puntos de Venta" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Puntos de Venta"
                    description="Cajas con numeración ARCA propia asociadas a un almacén."
                    actions={
                        <Link href={route('puntos-venta.create')}>
                            <Button><Plus className="size-4" /> Nuevo Punto de Venta</Button>
                        </Link>
                    }
                />
                <DataTable
                    columns={columns}
                    data={puntosVenta.data}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No hay puntos de venta registrados."
                />
                <Pagination links={puntosVenta.links} />
            </div>
        </AppLayout>
    );
}
