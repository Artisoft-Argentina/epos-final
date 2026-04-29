import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Plus, Edit, Package, AlertTriangle, SlidersHorizontal, History } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface Stock {
    id: number;
    quantity: number;
    calculated_quantity: number;
    product_id: number;
    product?: { name: string; sku: string };
}

interface Props { inventarios: Stock[]; }

interface AdjustState {
    stockId: number;
    productName: string;
    type: 'entry' | 'exit';
    quantity: string;
    reason: string;
}

export default function Index({ inventarios }: Props) {
    const page = usePage<any>();
    const userRole = page.props.auth?.user?.role?.role;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const [adjustModal, setAdjustModal] = useState<AdjustState | null>(null);
    const [adjusting, setAdjusting] = useState(false);

    useEffect(() => {
        if (page.props.flash?.success) toast.success(page.props.flash.success);
        if (page.props.flash?.info) toast.info(page.props.flash.info);
        if (page.props.flash?.error) toast.error(page.props.flash.error);
    }, [page.props.flash]);

    const hasAnyDiff = inventarios.some((s) => s.quantity !== s.calculated_quantity);

    const handleAdjustSubmit = () => {
        if (!adjustModal) return;
        if (!adjustModal.quantity || parseInt(adjustModal.quantity) <= 0) { toast.error('La cantidad debe ser mayor a 0.'); return; }
        if (!adjustModal.reason.trim()) { toast.error('El motivo es obligatorio.'); return; }
        const quantity = adjustModal.type === 'entry' ? parseInt(adjustModal.quantity) : -parseInt(adjustModal.quantity);
        setAdjusting(true);
        router.post(route('inventarios.adjust', adjustModal.stockId), { quantity, reason: adjustModal.reason }, {
            onFinish: () => { setAdjusting(false); setAdjustModal(null); },
        });
    };

    const columns: Column<Stock>[] = [
        {
            key: 'product',
            header: 'Artículo',
            render: (row) => (
                <div>
                    <p className="font-medium text-foreground">{row.product?.name ?? '-'}</p>
                    <p className="text-xs text-muted-foreground">{row.product?.sku}</p>
                </div>
            ),
        },
        {
            key: 'quantity',
            header: 'Stock actual',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Package className="size-4 text-muted-foreground" />
                    <span className="font-semibold tabular-nums text-foreground">{row.quantity}</span>
                </div>
            ),
        },
        {
            key: 'calculated_quantity',
            header: 'Stock calculado',
            render: (row) => <span className="font-semibold tabular-nums text-foreground">{row.calculated_quantity}</span>,
        },
        {
            key: 'status',
            header: 'Estado',
            render: (row) => {
                const diff = row.calculated_quantity - row.quantity;
                if (diff === 0) return <Badge variant="success">OK</Badge>;
                return <Badge variant="warning">{diff > 0 ? `Falta: ${diff}` : `Sobra: ${Math.abs(diff)}`}</Badge>;
            },
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => {
                const diff = row.calculated_quantity - row.quantity;
                return (
                    <div className="flex items-center justify-end gap-1">
                        {isAdmin && diff !== 0 && (
                            <Button variant="outline" size="icon" className="size-8 border-warning/30 text-warning hover:bg-warning-soft" title="Conciliar" onClick={() => router.post(route('inventarios.reconcile', row.id))}>
                                <AlertTriangle className="size-3.5" />
                            </Button>
                        )}
                        {isAdmin && (
                            <Button variant="outline" size="icon" className="size-8" title="Ajuste manual" onClick={() => setAdjustModal({ stockId: row.id, productName: row.product?.name ?? '-', type: 'entry', quantity: '', reason: '' })}>
                                <SlidersHorizontal className="size-3.5" />
                            </Button>
                        )}
                        <Link href={route('movimientos.index', row.product_id) + '?from=inventarios'}>
                            <Button variant="outline" size="icon" className="size-8" title="Movimientos"><History className="size-3.5" /></Button>
                        </Link>
                        <Link href={route('inventarios.edit', row.id)}>
                            <Button variant="outline" size="icon" className="size-8" title="Editar"><Edit className="size-3.5" /></Button>
                        </Link>
                        <DeleteConfirmationDialog
                            url={route('inventarios.destroy', row.id)}
                            title="Eliminar inventario"
                            description={`¿Está seguro que desea eliminar el inventario de ${row.product?.name}?`}
                        />
                    </div>
                );
            },
        },
    ];

    return (
        <AppLayout>
            <Head title="Inventarios" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Inventarios"
                    actions={
                        <>
                            {isAdmin && hasAnyDiff && (
                                <Button variant="outline" className="border-warning/30 text-warning hover:bg-warning-soft" onClick={() => router.post(route('inventarios.reconcile-all'))}>
                                    <AlertTriangle className="size-4" /> Conciliar Todo
                                </Button>
                            )}
                            <Link href={route('inventarios.create')}>
                                <Button><Plus className="size-4" /> Nuevo Inventario</Button>
                            </Link>
                        </>
                    }
                />

                <DataTable
                    columns={columns}
                    data={inventarios}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No hay inventarios registrados."
                />
            </div>

            <Dialog open={!!adjustModal} onOpenChange={(open) => { if (!open) setAdjustModal(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajuste manual — {adjustModal?.productName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label>Tipo de ajuste</Label>
                            <div className="flex gap-2 mt-1">
                                <Button type="button" variant={adjustModal?.type === 'entry' ? 'default' : 'outline'} className="flex-1" onClick={() => setAdjustModal((p) => p ? { ...p, type: 'entry' } : null)}>
                                    + Ingreso
                                </Button>
                                <Button type="button" variant={adjustModal?.type === 'exit' ? 'destructive' : 'outline'} className="flex-1" onClick={() => setAdjustModal((p) => p ? { ...p, type: 'exit' } : null)}>
                                    − Egreso
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adjust-quantity">Cantidad</Label>
                            <Input id="adjust-quantity" type="number" min="1" placeholder="Ej: 5" value={adjustModal?.quantity ?? ''} onChange={(e) => setAdjustModal((p) => p ? { ...p, quantity: e.target.value } : null)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adjust-reason">Motivo *</Label>
                            <Input id="adjust-reason" placeholder="Ej: Rotura, merma, corrección..." value={adjustModal?.reason ?? ''} onChange={(e) => setAdjustModal((p) => p ? { ...p, reason: e.target.value } : null)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdjustModal(null)}>Cancelar</Button>
                        <Button onClick={handleAdjustSubmit} disabled={adjusting}>{adjusting ? 'Aplicando...' : 'Aplicar ajuste'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
