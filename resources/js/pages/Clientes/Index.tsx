import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActionButton } from '@/components/action-button';
import { Pagination } from '@/components/pagination';
import { Plus, Edit, Search, FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';

interface Cliente {
    id: number;
    business_name: string;
    tax_id: string;
    email: string;
    phone: string;
}

interface Props {
    clientes: {
        data: Cliente[];
        links: any;
        meta: any;
    };
    filters: {
        search?: string;
    };
}

export default function Index({ clientes, filters }: Props) {
    const page = usePage<any>();
    const [search, setSearch] = useState(filters.search || '');
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (page.props.flash?.success) toast.success(page.props.flash.success);
    }, [page.props.flash]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            router.get(route('clientes.index'), { search: value }, { preserveState: true, replace: true });
        }, 300);
    };

    const columns: Column<Cliente>[] = [
        {
            key: 'business_name',
            header: 'Razón Social',
            render: (row) => <span className="font-medium text-foreground">{row.business_name}</span>,
        },
        {
            key: 'tax_id',
            header: 'CUIT / DNI',
            render: (row) => <span className="text-muted-foreground tabular-nums">{row.tax_id}</span>,
        },
        {
            key: 'contact',
            header: 'Contacto',
            render: (row) => (
                <div>
                    <p className="text-foreground">{row.email}</p>
                    <p className="text-muted-foreground text-xs">{row.phone}</p>
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Link href={route('clientes.estado-cuenta', row.id)}>
                        <ActionButton title="Estado de cuenta">
                            <FileText className="size-3.5" />
                        </ActionButton>
                    </Link>
                    <Link href={route('clientes.edit', row.id)}>
                        <ActionButton title="Editar">
                            <Edit className="size-3.5" />
                        </ActionButton>
                    </Link>
                    <DeleteConfirmationDialog
                        url={route('clientes.destroy', row.id)}
                        title="Eliminar cliente"
                        description={`¿Está seguro que desea eliminar al cliente ${row.business_name}? Esta acción no se puede deshacer.`}
                    />
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Clientes" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Clientes"
                    description={`${clientes.meta?.total ?? clientes.data.length} clientes registrados`}
                    actions={
                        <Link href={route('clientes.create')}>
                            <Button><Plus className="size-4" /> Nuevo Cliente</Button>
                        </Link>
                    }
                />

                <div className="max-w-sm">
                    <Input
                        startIcon={<Search className="size-4" />}
                        placeholder="Buscar por nombre, documento o email..."
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={clientes.data}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No se encontraron clientes."
                    footer={
                        <p className="text-sm text-muted-foreground">
                            {clientes.meta?.total ?? clientes.data.length} resultados
                        </p>
                    }
                />

                <Pagination links={clientes.links} />
            </div>
        </AppLayout>
    );
}
