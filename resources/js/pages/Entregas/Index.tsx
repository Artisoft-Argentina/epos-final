import { Head, router, usePage } from '@inertiajs/react';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { Pagination } from '@/components/pagination';
import { ActionButton } from '@/components/action-button';
import { CheckCircle, XCircle, Warehouse as WarehouseIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Warehouse {
    id: number;
    name: string;
    is_default: boolean;
}

interface WarehouseStock {
    warehouse_id: number;
    warehouse_name: string;
    quantity: number;
    is_pos_warehouse: boolean;
}

interface Entrega {
    id: number;
    quantity: number;
    delivery_date: string;
    actual_delivery_date: string | null;
    status: 'pending' | 'delivered' | 'cancelled';
    notes: string | null;
    warehouse_id: number | null;
    sale: { id: number; invoice_number: number; sale_type: string; customer: { id: number; business_name: string } };
    product: { id: number; name: string; sku: string };
    warehouse: { id: number; name: string } | null;
}

interface Props {
    entregas: { data: Entrega[]; links: any[] };
    warehouses: Warehouse[];
    selected_status: string;
    selected_warehouse_id: number | null;
    selected_sale_id: number | null;
}

const statusVariant: Record<string, 'warning' | 'success' | 'destructive'> = {
    pending: 'warning',
    delivered: 'success',
    cancelled: 'destructive',
};

const statusLabel: Record<string, string> = {
    pending: 'Pendiente',
    delivered: 'Entregada',
    cancelled: 'Cancelada',
};

export default function Index({ entregas, warehouses, selected_status, selected_warehouse_id, selected_sale_id }: Props) {
    const page = usePage<any>();
    const [markModal, setMarkModal] = useState<Entrega | null>(null);
    const [stockByWarehouse, setStockByWarehouse] = useState<WarehouseStock[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const { can } = usePermission();

    useEffect(() => {
        if (page.props.flash?.success) toast.success(page.props.flash.success);
        if (page.props.flash?.error) toast.error(page.props.flash.error);
    }, [page.props.flash]);

    const openMarkModal = async (entrega: Entrega) => {
        setMarkModal(entrega);
        setSelectedWarehouseId(entrega.warehouse_id ? String(entrega.warehouse_id) : '');
        try {
            const res = await fetch(route('products.stock-by-warehouse', entrega.product.id) + (entrega.warehouse_id ? `?pos_warehouse_id=${entrega.warehouse_id}` : ''), {
                headers: { Accept: 'application/json' },
            });
            if (res.ok) setStockByWarehouse(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const submitMarkDelivered = () => {
        if (!markModal) return;
        if (!selectedWarehouseId) {
            toast.error('Seleccioná un almacén.');
            return;
        }
        setSubmitting(true);
        router.post(route('entregas.marcar-entregada', markModal.id), { warehouse_id: selectedWarehouseId }, {
            onFinish: () => { setSubmitting(false); setMarkModal(null); setStockByWarehouse([]); },
        });
    };

    const cancelar = (id: number) => {
        if (confirm('¿Cancelar esta entrega?')) router.post(route('entregas.cancelar', id));
    };

    const baseParams = (overrides: Record<string, any>) => ({
        status: selected_status,
        warehouse_id: selected_warehouse_id ?? undefined,
        sale_id: selected_sale_id ?? undefined,
        ...overrides,
    });
    const filterByStatus = (s: string) => router.get(route('entregas.index'), baseParams({ status: s }), { preserveState: true });
    const filterByWarehouse = (w: string) => router.get(route('entregas.index'), baseParams({ warehouse_id: w === 'all' ? undefined : w }), { preserveState: true });
    const clearSaleFilter = () => router.get(route('entregas.index'), baseParams({ sale_id: undefined }), { preserveState: true });

    const columns: Column<Entrega>[] = [
        { key: 'sale', header: 'Factura', render: (row) => <span className="font-medium tabular-nums text-foreground">#{row.sale.invoice_number}</span> },
        { key: 'cliente', header: 'Cliente', render: (row) => <span>{row.sale.customer?.business_name ?? '-'}</span> },
        {
            key: 'product',
            header: 'Artículo',
            render: (row) => (
                <div>
                    <p className="font-medium text-foreground">{row.product.name}</p>
                    <p className="text-xs text-muted-foreground">{row.product.sku}</p>
                </div>
            ),
        },
        { key: 'qty', header: 'Cantidad', render: (row) => <span className="font-semibold tabular-nums">{row.quantity}</span> },
        {
            key: 'warehouse',
            header: 'Almacén',
            render: (row) => row.warehouse ? (
                <div className="flex items-center gap-1.5">
                    <WarehouseIcon className="text-muted-foreground size-3.5" />
                    <span>{row.warehouse.name}</span>
                </div>
            ) : <span className="text-muted-foreground">—</span>,
        },
        { key: 'date', header: 'Fecha', render: (row) => <span className="text-muted-foreground">{new Date(row.delivery_date).toLocaleDateString('es-AR')}</span> },
        { key: 'status', header: 'Estado', render: (row) => <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge> },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => row.status !== 'pending' ? null : (
                <div className="flex items-center justify-end gap-1">
                    {can('entregas.marcar-entregada') && (
                        <ActionButton variant="outline" title="Marcar entregada" className="border-success/30 text-success hover:bg-success-soft" onClick={() => openMarkModal(row)}>
                            <CheckCircle className="size-3.5" />
                        </ActionButton>
                    )}
                    {can('entregas.cancelar') && (
                        <ActionButton variant="destructive-soft" title="Cancelar entrega" onClick={() => cancelar(row.id)}>
                            <XCircle className="size-3.5" />
                        </ActionButton>
                    )}
                </div>
            ),
        },
    ];

    const stockSelected = stockByWarehouse.find((s) => String(s.warehouse_id) === selectedWarehouseId);
    const insufficient = markModal && stockSelected && stockSelected.quantity < markModal.quantity;

    return (
        <AppLayout>
            <Head title="Entregas" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader title="Entregas" description="Gestión de entregas asociadas a ventas." />

                {selected_sale_id && (
                    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                        <span>Filtrando por venta <span className="font-mono font-semibold">#{selected_sale_id}</span></span>
                        <Button variant="ghost" size="sm" onClick={clearSaleFilter}>Quitar filtro</Button>
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs">Estado</Label>
                        <Select value={selected_status} onValueChange={filterByStatus}>
                            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pendientes</SelectItem>
                                <SelectItem value="delivered">Entregadas</SelectItem>
                                <SelectItem value="cancelled">Canceladas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs">Almacén</Label>
                        <Select value={selected_warehouse_id ? String(selected_warehouse_id) : 'all'} onValueChange={filterByWarehouse}>
                            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {warehouses.map((w) => (
                                    <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DataTable columns={columns} data={entregas.data} keyExtractor={(row) => row.id} emptyMessage="No hay entregas." />
                <Pagination links={entregas.links} />
            </div>

            <Dialog open={!!markModal} onOpenChange={(open) => { if (!open) { setMarkModal(null); setStockByWarehouse([]); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Marcar entrega como completada</DialogTitle>
                    </DialogHeader>
                    {markModal && (
                        <div className="space-y-4 py-2">
                            <div className="rounded-lg bg-muted p-3 text-sm">
                                <p className="font-medium">{markModal.product.name}</p>
                                <p className="text-muted-foreground text-xs">Factura #{markModal.sale.invoice_number} — Cantidad: {markModal.quantity}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Almacén desde el que se entrega</Label>
                                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar almacén" /></SelectTrigger>
                                    <SelectContent>
                                        {stockByWarehouse.map((s) => (
                                            <SelectItem key={s.warehouse_id} value={String(s.warehouse_id)}>
                                                {s.warehouse_name} — Stock: {s.quantity}{s.is_pos_warehouse ? ' (PV)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {stockSelected && (
                                    <p className={`text-xs ${insufficient ? 'text-destructive' : 'text-muted-foreground'}`}>
                                        Stock disponible: {stockSelected.quantity} — Requerido: {markModal.quantity}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMarkModal(null)}>Cancelar</Button>
                        <Button onClick={submitMarkDelivered} disabled={submitting || !selectedWarehouseId || !!insufficient}>
                            {submitting ? 'Procesando...' : 'Confirmar entrega'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
