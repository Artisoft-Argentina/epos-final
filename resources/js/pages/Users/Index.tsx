import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActionButton } from '@/components/action-button';
import { Pagination } from '@/components/pagination';
import { Plus, Edit } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles?: { name: string }[];
    point_of_sale?: { id: number; name: string; pos_number: number } | null;
}
interface Props { users: { data: User[]; links: any; meta: any }; }

const roleVariant: Record<string, 'default' | 'info' | 'secondary'> = {
    superadmin: 'default',
    admin: 'info',
};

export default function Index({ users }: Props) {
    const columns: Column<User>[] = [
        {
            key: 'name',
            header: 'Nombre',
            render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
        },
        {
            key: 'email',
            header: 'Email',
            render: (row) => <span className="text-muted-foreground">{row.email}</span>,
        },
        {
            key: 'role',
            header: 'Rol',
            render: (row) => {
                const roleName = row.roles?.[0]?.name ?? '';
                return (
                    <Badge variant={roleVariant[roleName] ?? 'secondary'}>
                        {roleName || 'Sin rol'}
                    </Badge>
                );
            },
        },
        {
            key: 'pos',
            header: 'Punto de venta',
            render: (row) => row.point_of_sale
                ? <span className="text-foreground">{row.point_of_sale.name} <span className="text-muted-foreground text-xs">(#{row.point_of_sale.pos_number})</span></span>
                : <span className="text-muted-foreground">—</span>,
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center gap-1">
                    <Link href={route('users.edit', row.id)}>
                        <ActionButton title="Editar"><Edit className="size-3.5" /></ActionButton>
                    </Link>
                    <DeleteConfirmationDialog url={route('users.destroy', row.id)} title="Eliminar usuario" description={`¿Está seguro que desea eliminar al usuario ${row.name}?`} />
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Usuarios" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Usuarios"
                    actions={
                        <Link href={route('users.create')}>
                            <Button><Plus className="size-4" /> Nuevo Usuario</Button>
                        </Link>
                    }
                />
                <DataTable columns={columns} data={users.data} keyExtractor={(row) => row.id} emptyMessage="No hay usuarios registrados." />
                <Pagination links={users.links} />
            </div>
        </AppLayout>
    );
}
