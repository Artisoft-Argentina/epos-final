import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { Pagination } from '@/components/pagination';
import { ActionButton } from '@/components/action-button';
import { CheckCircle, XCircle } from 'lucide-react';

interface Entrega {
    id: number;
    cantidad: number;
    fecha_entrega: string;
    estado: 'pendiente' | 'entregada' | 'cancelada';
    factura: {
        id: number;
        numfactura: number;
        tipo_venta: string;
        cliente: { id: number; nombre: string; apellido: string };
    };
    articulo: { id: number; articulo: string; codarticulo: string };
}

interface Props {
    entregas: { data: Entrega[]; links: any[]; current_page: number; last_page: number };
}

const estadoVariant: Record<string, 'warning' | 'success' | 'destructive'> = {
    pendiente: 'warning',
    entregada: 'success',
    cancelada: 'destructive',
};

const tipoVariant: Record<string, 'info' | 'pending'> = {
    ecommerce: 'info',
    pos: 'pending',
};

export default function Index({ entregas }: Props) {
    const marcarEntregada = (id: number) => {
        if (confirm('¿Confirmar que esta entrega fue completada? Se descontará el stock.'))
            router.post(route('entregas.marcar-entregada', id));
    };

    const cancelarEntrega = (id: number) => {
        if (confirm('¿Cancelar esta entrega?')) router.post(route('entregas.cancelar', id));
    };

    const columns: Column<Entrega>[] = [
        {
            key: 'factura',
            header: 'Factura',
            render: (row) => <span className="font-medium tabular-nums text-foreground">#{row.factura.numfactura}</span>,
        },
        {
            key: 'cliente',
            header: 'Cliente',
            render: (row) => <span className="text-foreground">{row.factura.cliente.nombre} {row.factura.cliente.apellido}</span>,
        },
        {
            key: 'articulo',
            header: 'Artículo',
            render: (row) => (
                <div>
                    <p className="font-medium text-foreground">{row.articulo.articulo}</p>
                    <p className="text-xs text-muted-foreground">Cód: {row.articulo.codarticulo}</p>
                </div>
            ),
        },
        {
            key: 'cantidad',
            header: 'Cantidad',
            render: (row) => <span className="font-semibold tabular-nums text-foreground">{row.cantidad} uds.</span>,
        },
        {
            key: 'fecha_entrega',
            header: 'Fecha',
            render: (row) => <span className="text-muted-foreground">{new Date(row.fecha_entrega).toLocaleDateString('es-AR')}</span>,
        },
        {
            key: 'tipo_venta',
            header: 'Tipo',
            render: (row) => (
                <Badge variant={tipoVariant[row.factura.tipo_venta] ?? 'secondary'}>
                    {row.factura.tipo_venta === 'ecommerce' ? 'E-commerce' : 'POS'}
                </Badge>
            ),
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (row) => (
                <Badge variant={estadoVariant[row.estado]}>
                    {row.estado.charAt(0).toUpperCase() + row.estado.slice(1)}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => row.estado !== 'pendiente' ? null : (
                <div className="flex items-center gap-1">
                    <ActionButton variant="outline" title="Completar entrega" className="border-success/30 text-success hover:bg-success-soft" onClick={() => marcarEntregada(row.id)}>
                        <CheckCircle className="size-3.5" />
                    </ActionButton>
                    <ActionButton variant="destructive-soft" title="Cancelar entrega" onClick={() => cancelarEntrega(row.id)}>
                        <XCircle className="size-3.5" />
                    </ActionButton>
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Entregas Pendientes" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader title="Entregas Pendientes" description={`${entregas.data.length} entregas en el período`} />
                <DataTable columns={columns} data={entregas.data} keyExtractor={(row) => row.id} emptyMessage="No hay entregas pendientes." />
                <Pagination links={entregas.links} />
            </div>
        </AppLayout>
    );
}
