import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Package, AlertTriangle, CheckCircle2, SlidersHorizontal, History } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface Stock {
    id: number;
    quantity: number;
    calculated_quantity: number;
    product_id: number;
    product?: { name: string; sku: string; };
}

interface Props {
    inventarios: Stock[];
}

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

    const hasAnyDiff = inventarios.some(s => s.quantity !== s.calculated_quantity);

    const handleReconcile = (id: number) => {
        router.post(route('inventarios.reconcile', id));
    };

    const handleReconcileAll = () => {
        router.post(route('inventarios.reconcile-all'));
    };

    const openAdjustModal = (stock: Stock) => {
        setAdjustModal({
            stockId: stock.id,
            productName: stock.product?.name ?? '-',
            type: 'entry',
            quantity: '',
            reason: '',
        });
    };

    const handleAdjustSubmit = () => {
        if (!adjustModal) return;
        if (!adjustModal.quantity || parseInt(adjustModal.quantity) <= 0) {
            toast.error('La cantidad debe ser mayor a 0.');
            return;
        }
        if (!adjustModal.reason.trim()) {
            toast.error('El motivo es obligatorio.');
            return;
        }

        const quantity = adjustModal.type === 'entry'
            ? parseInt(adjustModal.quantity)
            : -parseInt(adjustModal.quantity);

        setAdjusting(true);
        router.post(
            route('inventarios.adjust', adjustModal.stockId),
            { quantity, reason: adjustModal.reason },
            {
                onFinish: () => {
                    setAdjusting(false);
                    setAdjustModal(null);
                },
            }
        );
    };

    const StatusBadge = ({ diff }: { diff: number }) => {
        if (diff === 0) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
                    <CheckCircle2 className="w-3 h-3" />
                    OK
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                <AlertTriangle className="w-3 h-3" />
                {diff > 0 ? `Falta: ${diff}` : `Sobra: ${Math.abs(diff)}`}
            </span>
        );
    };

    return (
        <AppLayout>
            <Head title="Inventarios" />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Inventarios</h1>
                    <div className="flex gap-2">
                        {isAdmin && hasAnyDiff && (
                            <Button variant="outline" onClick={handleReconcileAll} className="text-warning border-warning hover:bg-warning-soft">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Conciliar Todo
                            </Button>
                        )}
                        <Link href={route('inventarios.create')}>
                            <Button><Plus className="w-4 h-4 mr-2" />Nuevo Inventario</Button>
                        </Link>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Artículo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock actual</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock calculado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {inventarios.map((stock) => {
                                const diff = stock.calculated_quantity - stock.quantity;
                                const hasDiff = diff !== 0;
                                return (
                                    <tr key={stock.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{stock.product?.name ?? '-'}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-300">{stock.product?.sku}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Package className="w-4 h-4 mr-2 text-gray-400" />
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stock.quantity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stock.calculated_quantity}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge diff={diff} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {isAdmin && hasDiff && (
                                                    <Button variant="outline" size="sm" onClick={() => handleReconcile(stock.id)} className="text-warning border-warning hover:bg-warning-soft">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {isAdmin && (
                                                    <Button variant="outline" size="sm" onClick={() => openAdjustModal(stock)} title="Ajuste manual">
                                                        <SlidersHorizontal className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Link href={route('movimientos.index', stock.product_id) + '?from=inventarios'}>
                                                    <Button variant="outline" size="sm" title="Ver movimientos">
                                                        <History className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={route('inventarios.edit', stock.id)}>
                                                    <Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                                                </Link>
                                                <DeleteConfirmationDialog
                                                    url={route('inventarios.destroy', stock.id)}
                                                    title="Eliminar inventario"
                                                    description={`¿Está seguro que desea eliminar el inventario de ${stock.product?.name}? Esta acción no se puede deshacer.`}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {inventarios.map((stock) => {
                        const diff = stock.calculated_quantity - stock.quantity;
                        const hasDiff = diff !== 0;
                        return (
                            <Card key={stock.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{stock.product?.name ?? '-'}</CardTitle>
                                        <StatusBadge diff={diff} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm text-gray-600">SKU: {stock.product?.sku}</p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center">
                                                <Package className="w-4 h-4 mr-2 text-gray-400" />
                                                <span className="text-sm font-semibold">Actual: {stock.quantity}</span>
                                            </div>
                                            <span className="text-sm text-gray-500">Calculado: {stock.calculated_quantity}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {isAdmin && hasDiff && (
                                            <Button variant="outline" size="sm" onClick={() => handleReconcile(stock.id)} className="text-warning border-warning">
                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                Conciliar
                                            </Button>
                                        )}
                                        {isAdmin && (
                                            <Button variant="outline" size="sm" onClick={() => openAdjustModal(stock)}>
                                                <SlidersHorizontal className="w-4 h-4 mr-2" />
                                                Ajustar
                                            </Button>
                                        )}
                                        <Link href={route('movimientos.index', stock.product_id) + '?from=inventarios'}>
                                            <Button variant="outline" size="sm">
                                                <History className="w-4 h-4 mr-2" />
                                                Movimientos
                                            </Button>
                                        </Link>
                                        <Link href={route('inventarios.edit', stock.id)}>
                                            <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2" />Editar</Button>
                                        </Link>
                                        <DeleteConfirmationDialog
                                            url={route('inventarios.destroy', stock.id)}
                                            title="Eliminar inventario"
                                            description={`¿Está seguro que desea eliminar el inventario de ${stock.product?.name}? Esta acción no se puede deshacer.`}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Modal de ajuste manual */}
            <Dialog open={!!adjustModal} onOpenChange={(open) => { if (!open) setAdjustModal(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajuste manual — {adjustModal?.productName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label>Tipo de ajuste</Label>
                            <div className="flex gap-2 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setAdjustModal(prev => prev ? { ...prev, type: 'entry' } : null)}
                                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                                        adjustModal?.type === 'entry'
                                            ? 'bg-success border-success text-success-foreground'
                                            : 'border-input bg-background hover:bg-accent text-foreground'
                                    }`}
                                >
                                    + Ingreso
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAdjustModal(prev => prev ? { ...prev, type: 'exit' } : null)}
                                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                                        adjustModal?.type === 'exit'
                                            ? 'bg-destructive border-destructive text-white'
                                            : 'border-input bg-background hover:bg-accent text-foreground'
                                    }`}
                                >
                                    − Egreso
                                </button>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="adjust-quantity">Cantidad</Label>
                            <Input
                                id="adjust-quantity"
                                type="number"
                                min="1"
                                placeholder="Ej: 5"
                                value={adjustModal?.quantity ?? ''}
                                onChange={(e) => setAdjustModal(prev => prev ? { ...prev, quantity: e.target.value } : null)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="adjust-reason">Motivo *</Label>
                            <Input
                                id="adjust-reason"
                                placeholder="Ej: Rotura, merma, corrección de conteo..."
                                value={adjustModal?.reason ?? ''}
                                onChange={(e) => setAdjustModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdjustModal(null)}>Cancelar</Button>
                        <Button onClick={handleAdjustSubmit} disabled={adjusting}>
                            {adjusting ? 'Aplicando...' : 'Aplicar ajuste'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
