import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Package } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Stock {
    id: number;
    quantity: number;
    batch?: number;
    expiration_date?: string;
    product?: { name: string; sku: string; };
    supplier?: { business_name: string; };
}

interface Props {
    inventarios: Stock[];
}

export default function Index({ inventarios }: Props) {
    const page = usePage<any>();

    useEffect(() => {
        if (page.props.flash?.success) toast.success(page.props.flash.success);
    }, [page.props.flash]);

    return (
        <AppLayout>
            <Head title="Inventarios" />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Inventarios</h1>
                    <Link href={route('inventarios.create')}>
                        <Button><Plus className="w-4 h-4 mr-2" />Nuevo Inventario</Button>
                    </Link>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Artículo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Proveedor</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {inventarios.map((stock) => (
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
                                        <div className="text-sm text-gray-500 dark:text-gray-300">{stock.supplier?.business_name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
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
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {inventarios.map((stock) => (
                        <Card key={stock.id}>
                            <CardHeader><CardTitle className="text-lg">{stock.product?.name ?? '-'}</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2 mb-4">
                                    <p className="text-sm text-gray-600">SKU: {stock.product?.sku}</p>
                                    <div className="flex items-center">
                                        <Package className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="text-sm font-semibold">Cantidad: {stock.quantity}</span>
                                    </div>
                                    {stock.batch && <p className="text-sm text-gray-600">Lote: {stock.batch}</p>}
                                    {stock.expiration_date && (
                                        <p className="text-sm text-gray-600">Vencimiento: {new Date(stock.expiration_date).toLocaleDateString()}</p>
                                    )}
                                    {stock.supplier && <p className="text-sm text-gray-600">Proveedor: {stock.supplier.business_name}</p>}
                                </div>
                                <div className="flex gap-2">
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
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
