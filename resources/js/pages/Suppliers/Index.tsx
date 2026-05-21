import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActionButton } from '@/components/action-button';
import { Pagination } from '@/components/pagination';
import { Plus, Edit } from 'lucide-react';

interface Supplier { id: number; business_name: string; tax_id: string; address: string; phone: string; email?: string; }
interface Props { suppliers: { data: Supplier[]; links: any; meta: any }; }

export default function Index({ suppliers }: Props) {

    const columns: Column<Supplier>[] = [
        {
            key: 'business_name',
            header: 'Razón Social',
            render: (row) => (
                <div>
                    <p className="font-medium text-foreground">{row.business_name}</p>
                    <p className="text-xs text-muted-foreground">{row.address}</p>
                </div>
            ),
        },
        {
            key: 'tax_id',
            header: 'CUIT',
            render: (row) => <span className="font-mono text-muted-foreground">{row.tax_id}</span>,
        },
        {
            key: 'phone',
            header: 'Teléfono',
            render: (row) => <span className="text-foreground">{row.phone}</span>,
        },
        {
            key: 'email',
            header: 'Email',
            render: (row) => <span className="text-muted-foreground">{row.email || '—'}</span>,
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center gap-1">
                    <Link href={route('suppliers.edit', row.id)}>
                        <ActionButton title="Editar"><Edit className="size-3.5" /></ActionButton>
                    </Link>
                    <DeleteConfirmationDialog url={route('suppliers.destroy', row.id)} title="Eliminar proveedor" description={`¿Está seguro que desea eliminar el proveedor ${row.business_name}?`} />
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Proveedores" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Proveedores"
                    actions={
                        <Link href={route('suppliers.create')}>
                            <Button><Plus className="size-4" /> Nuevo Proveedor</Button>
                        </Link>
                    }
                />
                <DataTable columns={columns} data={suppliers.data} keyExtractor={(row) => row.id} emptyMessage="No hay proveedores registrados." />
                <Pagination links={suppliers.links} />
            </div>
        </AppLayout>
    );
}
