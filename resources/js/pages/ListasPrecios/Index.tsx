import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActionButton } from '@/components/action-button';
import { Plus, Edit, Eye } from 'lucide-react';

interface ListaPrecio { id: number; name: string; percentage: number; default_pos: boolean; default_ecommerce: boolean; }
interface Props { listas: ListaPrecio[]; }

export default function Index({ listas }: Props) {
    const columns: Column<ListaPrecio>[] = [
        {
            key: 'name',
            header: 'Nombre',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{row.name}</span>
                    {row.default_pos && <Badge variant="info">POS Default</Badge>}
                    {row.default_ecommerce && <Badge variant="success">E-commerce Default</Badge>}
                </div>
            ),
        },
        {
            key: 'percentage',
            header: 'Incremento',
            render: (row) => <span className="font-semibold tabular-nums text-foreground">{row.percentage}%</span>,
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center gap-1">
                    <Link href={route('listas-precios.show', row.id)}>
                        <ActionButton title="Ver precios"><Eye className="size-3.5" /></ActionButton>
                    </Link>
                    <Link href={route('listas-precios.edit', row.id)}>
                        <ActionButton title="Editar"><Edit className="size-3.5" /></ActionButton>
                    </Link>
                    <DeleteConfirmationDialog url={route('listas-precios.destroy', row.id)} title="Eliminar lista de precios" description={`¿Estás seguro de eliminar la lista ${row.name}?`} />
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Listas de Precios" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Listas de Precios"
                    actions={
                        <Link href={route('listas-precios.create')}>
                            <Button><Plus className="size-4" /> Nueva Lista</Button>
                        </Link>
                    }
                />
                <DataTable columns={columns} data={listas} keyExtractor={(row) => row.id} emptyMessage="No hay listas de precios creadas." />
            </div>
        </AppLayout>
    );
}
