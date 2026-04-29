import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Pagination } from '@/components/pagination';
import { Plus, Edit } from 'lucide-react';

interface Role { id: number; role: string; permission?: string; description?: string; }
interface Props { roles: { data: Role[]; links: any; meta: any }; }

export default function Index({ roles }: Props) {
    const columns: Column<Role>[] = [
        {
            key: 'role',
            header: 'Rol',
            render: (row) => <span className="font-medium text-foreground">{row.role}</span>,
        },
        {
            key: 'permission',
            header: 'Permisos',
            render: (row) => <span className="text-muted-foreground">{row.permission}</span>,
        },
        {
            key: 'description',
            header: 'Descripción',
            render: (row) => <span className="text-muted-foreground">{row.description}</span>,
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Link href={route('roles.edit', row.id)}>
                        <Button variant="outline" size="icon" className="size-8" title="Editar"><Edit className="size-3.5" /></Button>
                    </Link>
                    <DeleteConfirmationDialog
                        url={route('roles.destroy', row.id)}
                        title="Eliminar rol"
                        description={`¿Está seguro que desea eliminar el rol ${row.role}?`}
                    />
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Roles" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Roles"
                    actions={
                        <Link href={route('roles.create')}>
                            <Button><Plus className="size-4" /> Nuevo Rol</Button>
                        </Link>
                    }
                />
                <DataTable columns={columns} data={roles.data} keyExtractor={(row) => row.id} emptyMessage="No hay roles registrados." />
                <Pagination links={roles.links} />
            </div>
        </AppLayout>
    );
}
