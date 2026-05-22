import { Head, Link } from '@inertiajs/react';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActionButton } from '@/components/action-button';
import { Pagination } from '@/components/pagination';
import { Plus, Edit, Warehouse as WarehouseIcon } from 'lucide-react';

interface Warehouse {
    id: number;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    is_default: boolean;
    active: boolean;
}

interface Props { warehouses: { data: Warehouse[]; links: any; meta: any }; }

export default function Index({ warehouses }: Props) {
    const { can } = usePermission();
    const columns: Column<Warehouse>[] = [
        {
            key: 'name',
            header: 'Almacén',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <WarehouseIcon className="size-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{row.name}</span>
                    {row.is_default && <Badge variant="secondary">Default</Badge>}
                    {!row.active && <Badge variant="outline">Inactivo</Badge>}
                </div>
            ),
        },
        { key: 'code', header: 'Código', render: (row) => <span className="font-mono text-xs">{row.code}</span> },
        { key: 'address', header: 'Dirección', render: (row) => row.address ?? '-' },
        { key: 'phone', header: 'Teléfono', render: (row) => row.phone ?? '-' },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    {can('almacenes.edit') && (
                        <Link href={route('almacenes.edit', row.id)}>
                            <ActionButton title="Editar"><Edit className="size-3.5" /></ActionButton>
                        </Link>
                    )}
                    {can('almacenes.destroy') && !row.is_default && (
                        <DeleteConfirmationDialog
                            url={route('almacenes.destroy', row.id)}
                            title="Eliminar almacén"
                            description={`¿Seguro que deseas eliminar el almacén ${row.name}?`}
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Almacenes" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Almacenes"
                    description="Depósitos físicos donde vive el inventario."
                    actions={
                        can('almacenes.create') && (
                            <Link href={route('almacenes.create')}>
                                <Button><Plus className="size-4" /> Nuevo Almacén</Button>
                            </Link>
                        )
                    }
                />
                <DataTable
                    columns={columns}
                    data={warehouses.data}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No hay almacenes registrados."
                />
                <Pagination links={warehouses.links} />
            </div>
        </AppLayout>
    );
}
