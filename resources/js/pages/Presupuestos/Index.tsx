import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Eye, ShoppingCart } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Pagination } from '@/components/pagination';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface Presupuesto {
    id: number;
    numpresupuesto: number;
    fecha: string;
    total: number;
    cliente: {
        razonsocial: string;
    };
    user: {
        name: string;
    };
}

interface Props {
    presupuestos: {
        data: Presupuesto[];
        links: any;
        meta: any;
    };
}

export default function Index({ presupuestos }: Props) {
    const page = usePage<any>();
    const [filtro, setFiltro] = useState('');
    
    useEffect(() => {
        if (page.props.flash?.success) {
            toast.success(page.props.flash.success);
        }
    }, [page.props.flash]);

    const presupuestosFiltrados = presupuestos.data.filter(presupuesto =>
        presupuesto.cliente.razonsocial.toLowerCase().includes(filtro.toLowerCase()) ||
        presupuesto.numpresupuesto.toString().includes(filtro) ||
        presupuesto.user.name.toLowerCase().includes(filtro.toLowerCase())
    );

    const convertirAVenta = (presupuestoId: number) => {
        if (confirm('¿Convertir este presupuesto en una venta?')) {
            router.post(route('presupuestos.convertir-venta', presupuestoId));
        }
    };

    return (
        <AppLayout>
            <Head title="Presupuestos" />
            
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Presupuestos</h1>
                    <Link href={route('presupuestos.create')}>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Presupuesto
                        </Button>
                    </Link>
                </div>

                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Input
                            placeholder="Buscar por cliente, número o vendedor..."
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Presupuesto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Vendedor
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {presupuestosFiltrados.map((presupuesto) => (
                                <tr key={presupuesto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">#{presupuesto.numpresupuesto}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{presupuesto.cliente.razonsocial}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-gray-100">
                                            {new Date(presupuesto.fecha).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">${Number(presupuesto.total).toFixed(2)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">{presupuesto.user.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => convertirAVenta(presupuesto.id)}
                                                title="Convertir a Venta"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                            </Button>
                                            <Link href={route('presupuestos.show', presupuesto.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <DeleteConfirmationDialog
                                                url={route('presupuestos.destroy', presupuesto.id)}
                                                title="Eliminar presupuesto"
                                                description={`¿Está seguro que desea eliminar el presupuesto #${presupuesto.numpresupuesto}?`}
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
                    {presupuestosFiltrados.map((presupuesto) => (
                        <Card key={presupuesto.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Presupuesto #{presupuesto.numpresupuesto}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mb-4">
                                    <p className="text-sm text-gray-600">Cliente: {presupuesto.cliente.razonsocial}</p>
                                    <p className="text-sm text-gray-600">Fecha: {new Date(presupuesto.fecha).toLocaleDateString()}</p>
                                    <p className="text-sm font-semibold text-gray-900">Total: ${Number(presupuesto.total).toFixed(2)}</p>
                                    <p className="text-sm text-gray-600">Vendedor: {presupuesto.user.name}</p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => convertirAVenta(presupuesto.id)}
                                    >
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        Vender
                                    </Button>
                                    <Link href={route('presupuestos.show', presupuesto.id)}>
                                        <Button variant="outline" size="sm">
                                            <Eye className="w-4 h-4 mr-2" />
                                            Ver
                                        </Button>
                                    </Link>
                                    <DeleteConfirmationDialog
                                        url={route('presupuestos.destroy', presupuesto.id)}
                                        title="Eliminar presupuesto"
                                        description={`¿Está seguro que desea eliminar el presupuesto #${presupuesto.numpresupuesto}?`}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Pagination links={presupuestos.links} />
            </div>
        </AppLayout>
    );
}