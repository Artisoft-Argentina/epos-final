import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { ConfirmActionDialog } from '@/components/confirm-action-dialog';
import { ActionButton } from '@/components/action-button';
import { Pagination } from '@/components/pagination';
import { Plus, Eye, Edit, DollarSign, Package, FileText, Download, Search, Ban } from 'lucide-react';
import { useState } from 'react';
import { usePermission } from '@/hooks/use-permission';
import { paymentStatusMeta, isOwing, isCancelled } from '@/lib/payment-status';
import { formatVoucher } from '@/lib/sale-number';

interface Sale {
    id: number;
    invoice_number: number;
    voucher_letter: string;
    pos_number: number;
    date: string;
    total: number;
    payment_status: string;
    cae?: string;
    customer: { business_name: string; fantasy_name?: string | null };
    user: { name: string };
    products: Array<{ pivot: { quantity: number } }>;
    deliveries: Array<{ quantity: number; status: 'pending' | 'delivered' | 'cancelled' }>;
}

interface Props {
    facturas: {
        data: Sale[];
        links: any[];
        current_page: number;
        last_page: number;
    };
}

function formatDate(dateStr: string) {
    const f = dateStr.split('T')[0].split('-');
    return `${f[2]}/${f[1]}/${f[0]}`;
}

const fmt = (n: number | string) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

function entregasPendientes(sale: Sale): number {
    return sale.deliveries?.filter((d) => d.status === 'pending').length ?? 0;
}

export default function Index({ facturas }: Props) {
    const page = usePage<any>();
    const { can } = usePermission();
    const [search, setSearch] = useState('');

    const filtered = facturas.data.filter((s) =>
        s.customer.business_name.toLowerCase().includes(search.toLowerCase()) ||
        s.invoice_number.toString().includes(search) ||
        formatVoucher(s.voucher_letter, s.pos_number, s.invoice_number).toLowerCase().includes(search.toLowerCase()) ||
        s.user.name.toLowerCase().includes(search.toLowerCase())
    );

    const columns: Column<Sale>[] = [
        {
            key: 'invoice_number',
            header: 'Factura',
            render: (row) => (
                <span className="font-medium tabular-nums text-foreground">
                    {formatVoucher(row.voucher_letter, row.pos_number, row.invoice_number)}
                </span>
            ),
        },
        {
            key: 'customer',
            header: 'Cliente',
            render: (row) => <span className="text-foreground">{row.customer.business_name}</span>,
        },
        {
            key: 'date',
            header: 'Fecha',
            render: (row) => <span className="text-muted-foreground">{formatDate(row.date)}</span>,
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            render: (row) => (
                <span className="font-semibold tabular-nums text-foreground">{fmt(row.total)}</span>
            ),
        },
        {
            key: 'payment_status',
            header: 'Estado',
            render: (row) => {
                const meta = paymentStatusMeta(row.payment_status);
                return <Badge variant={meta.variant}>{meta.label}</Badge>;
            },
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center gap-1">
                    {can('ventas.show') && (
                        <Link href={route('sales.show', row.id)}>
                            <ActionButton title="Ver"><Eye className="size-3.5" /></ActionButton>
                        </Link>
                    )}
                    {can('ventas.edit') && !row.cae && !isCancelled(row.payment_status) && (
                        <Link href={route('sales.edit', row.id)}>
                            <ActionButton title="Editar"><Edit className="size-3.5" /></ActionButton>
                        </Link>
                    )}
                    {can('entregas.create') && !isCancelled(row.payment_status) && entregasPendientes(row) > 0 && (
                        <Link href={route('entregas.index') + `?status=pending&sale_id=${row.id}`}>
                            <ActionButton
                                title={`Marcar entregas (${entregasPendientes(row)} pendiente${entregasPendientes(row) !== 1 ? 's' : ''})`}
                                className="border-warning/30 text-warning hover:bg-warning-soft"
                                variant="outline"
                            >
                                <Package className="size-3.5" />
                            </ActionButton>
                        </Link>
                    )}
                    {can('afip.authorize') && !row.cae && !isCancelled(row.payment_status) && (
                        <ActionButton title="Autorizar AFIP" onClick={() => router.post(route('afip.authorize', row.id))}>
                            <FileText className="size-3.5" />
                        </ActionButton>
                    )}
                    {row.cae && (
                        <a href={route('facturas.pdf', row.id)} target="_blank">
                            <ActionButton title="Descargar PDF"><Download className="size-3.5" /></ActionButton>
                        </a>
                    )}
                    {can('pagos.create') && isOwing(row.payment_status) && (
                        <Link href={route('pagos.create', row.id)}>
                            <ActionButton title="Registrar pago"><DollarSign className="size-3.5" /></ActionButton>
                        </Link>
                    )}
                    {can('ventas.destroy') && !isCancelled(row.payment_status) && (
                        <ConfirmActionDialog
                            url={route('sales.cancel', row.id)}
                            method="patch"
                            title="Cancelar venta"
                            description={`¿Cancelar la ${formatVoucher(row.voucher_letter, row.pos_number, row.invoice_number)} de ${row.customer.business_name} por ${fmt(row.total)}? Se restaurará el inventario entregado y se acreditará lo pagado al cliente. La cancelación no se puede deshacer.`}
                            confirmLabel="Cancelar venta"
                            processingLabel="Cancelando..."
                            trigger={
                                <ActionButton title="Cancelar venta" variant="destructive-soft">
                                    <Ban className="size-3.5" />
                                </ActionButton>
                            }
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Ventas" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Ventas"
                    description={`${facturas.data.length} ventas en el período`}
                    actions={
                        can('ventas.create') && (
                            <Link href={route('sales.create')}>
                                <Button><Plus className="size-4" /> Nueva Venta</Button>
                            </Link>
                        )
                    }
                />

                <div className="max-w-sm">
                    <Input
                        startIcon={<Search className="size-4" />}
                        placeholder="Buscar por cliente, número o vendedor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={filtered}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No se encontraron ventas."
                />

                <Pagination links={facturas.links} />
            </div>
        </AppLayout>
    );
}
