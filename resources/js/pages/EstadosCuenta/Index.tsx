import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { Pagination } from '@/components/pagination';
import { FileText, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface Cliente {
    id: number;
    razonsocial: string;
    documentounico: string;
    email: string;
    telefono: string;
    saldo_pendiente?: number;
}

interface Props {
    clientes: { data: Cliente[]; links: any; meta: any };
}

export default function Index({ clientes }: Props) {
    const page = usePage<any>();
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (page.props.flash?.success) toast.success(page.props.flash.success);
    }, [page.props.flash]);

    const filtered = clientes.data.filter((c) =>
        c.razonsocial.toLowerCase().includes(search.toLowerCase()) ||
        c.documentounico.toString().includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    const columns: Column<Cliente>[] = [
        {
            key: 'razonsocial',
            header: 'Cliente',
            render: (row) => <span className="font-medium text-foreground">{row.razonsocial}</span>,
        },
        {
            key: 'documentounico',
            header: 'Documento',
            render: (row) => <span className="font-mono text-muted-foreground">{row.documentounico}</span>,
        },
        {
            key: 'contact',
            header: 'Contacto',
            render: (row) => (
                <div>
                    <p className="text-foreground">{row.email}</p>
                    <p className="text-xs text-muted-foreground">{row.telefono}</p>
                </div>
            ),
        },
        {
            key: 'saldo_pendiente',
            header: 'Saldo Pendiente',
            align: 'right',
            render: (row) => (
                <span className={`font-semibold tabular-nums ${(row.saldo_pendiente ?? 0) > 0 ? 'text-destructive' : 'text-success'}`}>
                    ${(row.saldo_pendiente ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Link href={route('clientes.estado-cuenta', row.id)}>
                        <Button variant="outline" size="icon" className="size-8" title="Ver estado de cuenta">
                            <FileText className="size-3.5" />
                        </Button>
                    </Link>
                    <Link href={route('clientes.exportar-excel', row.id)}>
                        <Button variant="outline" size="icon" className="size-8" title="Exportar Excel">
                            <Download className="size-3.5" />
                        </Button>
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Estados de Cuenta" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader title="Estados de Cuenta" description={`${clientes.data.length} clientes`} />
                <div className="max-w-sm">
                    <Input
                        startIcon={<Search className="size-4" />}
                        placeholder="Buscar por nombre, documento o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <DataTable
                    columns={columns}
                    data={filtered}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No se encontraron clientes."
                />
                <Pagination links={clientes.links} />
            </div>
        </AppLayout>
    );
}
