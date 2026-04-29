import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Eye, Edit, DollarSign, Package, FileText, Download } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Pagination } from '@/components/pagination';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface Sale {
    id: number;
    invoice_number: number;
    date: string;
    total: number;
    payment_status: string;
    cae?: string;
    customer: { business_name: string; };
    user: { name: string; };
    products: Array<{ pivot: { quantity: number; }; }>;
    deliveries: Array<{ quantity: number; }>;
}

interface Props {
    facturas: {
        data: Sale[];
        links: any[];
        current_page: number;
        last_page: number;
    };
}

export default function Index({ facturas }: Props) {
    const page = usePage<any>();
    const [filtro, setFiltro] = useState('');

    useEffect(() => {
        if (page.props.flash?.success) {
            toast.success(page.props.flash.success);
        }
    }, [page.props.flash]);

    const clientesFiltrados = facturas.data.filter(sale =>
        sale.customer.business_name.toLowerCase().includes(filtro.toLowerCase()) ||
        sale.invoice_number.toString().includes(filtro) ||
        sale.user.name.toLowerCase().includes(filtro.toLowerCase())
    );

    const tieneEntregasPendientes = (sale: Sale) => {
        const totalVendido = sale.products?.reduce((sum, p) => sum + p.pivot.quantity, 0) || 0;
        const totalEntregado = sale.deliveries?.reduce((sum, d) => sum + d.quantity, 0) || 0;
        return totalEntregado < totalVendido;
    };

    const autorizarAfip = (facturaId: number) => {
        router.post(route('afip.authorize', facturaId));
    };

    return (
        <AppLayout>
            <Head title="Ventas" />

            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Ventas</h1>
                    <Link href={route('ventas.create')}>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Venta
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
                                    Factura
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
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {clientesFiltrados.map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">#{sale.invoice_number}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{sale.customer.business_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-gray-100">
                                            {(() => { const f = sale.date.split('T')[0].split('-'); return `${f[2]}/${f[1]}`; })()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">${Number(sale.total).toFixed(2)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={sale.payment_status === 'SI' ? 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800' : 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800'}>
                                            {sale.payment_status === 'SI' ? 'Pagada' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link href={route('ventas.show', sale.id)}>
                                                <Button variant="outline" size="sm"><Eye className="w-4 h-4" /></Button>
                                            </Link>
                                            {!sale.cae && (
                                                <Link href={route('ventas.edit', sale.id)}>
                                                    <Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                                                </Link>
                                            )}
                                            {tieneEntregasPendientes(sale) && (
                                                <Link href={route('entregas.create', sale.id)}>
                                                    <Button variant="outline" size="sm"><Package className="w-4 h-4" /></Button>
                                                </Link>
                                            )}
                                            {!sale.cae && (
                                                <Button variant="outline" size="sm" onClick={() => autorizarAfip(sale.id)} title="Autorizar en AFIP">
                                                    <FileText className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {sale.cae && (
                                                <a href={route('facturas.pdf', sale.id)} target="_blank">
                                                    <Button variant="outline" size="sm" title="Descargar PDF"><Download className="w-4 h-4" /></Button>
                                                </a>
                                            )}
                                            {sale.payment_status === 'NO' && (
                                                <Link href={route('pagos.create', sale.id)}>
                                                    <Button variant="outline" size="sm"><DollarSign className="w-4 h-4" /></Button>
                                                </Link>
                                            )}
                                            <DeleteConfirmationDialog
                                                url={route('ventas.destroy', sale.id)}
                                                title="Eliminar venta"
                                                description={`¿Está seguro que desea eliminar la venta #${sale.invoice_number}? Esta acción restaurará el inventario.`}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination links={facturas.links} />

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {clientesFiltrados.map((sale) => (
                        <Card key={sale.id}>
                            <CardHeader>
                                <CardTitle className="text-lg flex justify-between items-center">
                                    <span>Factura #{sale.invoice_number}</span>
                                    <span className={sale.payment_status === 'SI' ? 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800' : 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800'}>
                                        {sale.payment_status === 'SI' ? 'Pagada' : 'Pendiente'}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mb-4">
                                    <p className="text-sm text-gray-600">Cliente: {sale.customer.business_name}</p>
                                    <p className="text-sm text-gray-600">Fecha: {(() => { const f = sale.date.split('T')[0].split('-'); return `${f[2]}/${f[1]}`; })()}</p>
                                    <p className="text-sm font-semibold text-gray-900">Total: ${Number(sale.total).toFixed(2)}</p>
                                    <p className="text-sm text-gray-600">Vendedor: {sale.user.name}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={route('ventas.show', sale.id)}><Button variant="outline" size="sm"><Eye className="w-4 h-4" /></Button></Link>
                                    {!sale.cae && <Link href={route('ventas.edit', sale.id)}><Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button></Link>}
                                    {tieneEntregasPendientes(sale) && <Link href={route('entregas.create', sale.id)}><Button variant="outline" size="sm"><Package className="w-4 h-4" /></Button></Link>}
                                    {!sale.cae && <Button variant="outline" size="sm" onClick={() => autorizarAfip(sale.id)}><FileText className="w-4 h-4" /></Button>}
                                    {sale.cae && <a href={route('facturas.pdf', sale.id)} target="_blank"><Button variant="outline" size="sm"><Download className="w-4 h-4" /></Button></a>}
                                    {sale.payment_status === 'NO' && <Link href={route('pagos.create', sale.id)}><Button variant="outline" size="sm"><DollarSign className="w-4 h-4" /></Button></Link>}
                                    <DeleteConfirmationDialog url={route('ventas.destroy', sale.id)} title="Eliminar venta" description={`¿Está seguro que desea eliminar la venta #${sale.invoice_number}? Esta acción restaurará el inventario.`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
