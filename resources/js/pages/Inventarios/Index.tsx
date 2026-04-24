import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Stock {
    id: number;
    quantity: number;
    calculated_quantity: number;
    product?: { name: string; sku: string; };
}

interface Props {
    inventarios: Stock[];
}

export default function Index({ inventarios }: Props) {
    const page = usePage<any>();

    useEffect(() => {
        if (page.props.flash?.success) toast.success(page.props.flash.success);
        if (page.props.flash?.info) toast.info(page.props.flash.info);
    }, [page.props.flash]);

    const hasAnyDiff = inventarios.some(s => s.quantity !== s.calculated_quantity);

    const handleReconcile = (id: number) => {
        router.post(route('inventarios.reconcile', id));
    };

    const handleReconcileAll = () => {
        router.post(route('inventarios.reconcile-all'));
    };

    return (
        <AppLayout>
            <Head title="Inventarios" />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Inventarios</h1>
                    <div className="flex gap-2">
                        {hasAnyDiff && (
                            <Button variant="outline" onClick={handleReconcileAll} className="text-yellow-600 border-yellow-400 hover:bg-yellow-50">
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
                                            {hasDiff ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {diff > 0 ? `Falta: ${diff}` : `Sobra: ${Math.abs(diff)}`}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    OK
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {hasDiff && (
                                                    <Button variant="outline" size="sm" onClick={() => handleReconcile(stock.id)} className="text-yellow-600 border-yellow-400 hover:bg-yellow-50">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </Button>
                                                )}
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
                                        {hasDiff ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                                                <AlertTriangle className="w-3 h-3" />
                                                {diff > 0 ? `Falta: ${diff}` : `Sobra: ${Math.abs(diff)}`}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                <CheckCircle2 className="w-3 h-3" />
                                                OK
                                            </span>
                                        )}
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
                                        {hasDiff && (
                                            <Button variant="outline" size="sm" onClick={() => handleReconcile(stock.id)} className="text-yellow-600 border-yellow-400">
                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                Conciliar
                                            </Button>
                                        )}
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
        </AppLayout>
    );
}
