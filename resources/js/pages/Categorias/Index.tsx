import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Pagination } from '@/components/pagination';
import { Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Categoria { id: number; name: string; }
interface Props { categorias: { data: Categoria[]; links: any; meta: any }; }

export default function Index({ categorias }: Props) {
    const page = usePage<any>();
    useEffect(() => {
        if (page.props.flash?.success) toast.success(page.props.flash.success);
    }, [page.props.flash]);

    const columns: Column<Categoria>[] = [
        {
            key: 'name',
            header: 'Nombre',
            render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Link href={route('categorias.edit', row.id)}>
                        <Button variant="outline" size="icon" className="size-8" title="Editar"><Edit className="size-3.5" /></Button>
                    </Link>
                    <DeleteConfirmationDialog
                        url={route('categorias.destroy', row.id)}
                        title="Eliminar categoría"
                        description={`¿Está seguro que desea eliminar la categoría ${row.name}?`}
                    />
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Categorías" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Categorías"
                    actions={
                        <Link href={route('categorias.create')}>
                            <Button><Plus className="size-4" /> Nueva Categoría</Button>
                        </Link>
                    }
                />
                <DataTable
                    columns={columns}
                    data={categorias.data}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No hay categorías registradas."
                />
                <Pagination links={categorias.links} />
            </div>
        </AppLayout>
    );
}
