import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Package, CheckCircle, XCircle, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Entrega {
    id: number;
    cantidad: number;
    fecha_entrega: string;
    fecha_entrega_real: string | null;
    observaciones: string | null;
    estado: 'pendiente' | 'entregada' | 'cancelada';
    factura: {
        id: number;
        numfactura: number;
        tipo_venta: string;
        cliente: {
            id: number;
            nombre: string;
            apellido: string;
        };
    };
    articulo: {
        id: number;
        articulo: string;
        codarticulo: string;
    };
}

interface Props {
    entregas: {
        data: Entrega[];
        links: any[];
        current_page: number;
        last_page: number;
    };
}

export default function Index({ entregas }: Props) {
    const marcarEntregada = (entregaId: number) => {
        if (confirm('¿Confirmar que esta entrega fue completada? Se descontará el stock.')) {
            router.post(route('entregas.marcar-entregada', entregaId));
        }
    };

    const cancelarEntrega = (entregaId: number) => {
        if (confirm('¿Cancelar esta entrega?')) {
            router.post(route('entregas.cancelar', entregaId));
        }
    };

    const getEstadoBadge = (estado: string) => {
        const badges = {
            pendiente: 'bg-yellow-100 text-yellow-800',
            entregada: 'bg-green-100 text-green-800',
            cancelada: 'bg-red-100 text-red-800',
        };
        return badges[estado as keyof typeof badges] || badges.pendiente;
    };

    const getTipoVentaBadge = (tipo: string) => {
        return tipo === 'ecommerce' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-purple-100 text-purple-800';
    };

    return (
        <AppLayout
            title="Entregas Pendientes"
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Entregas Pendientes
                    </h2>
                </div>
            }
        >
            <Head title="Entregas Pendientes" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {entregas.data.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        No hay entregas pendientes
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Todas las entregas están completadas
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Factura
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Cliente
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Artículo
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Cantidad
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Fecha Entrega
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Tipo
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Estado
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {entregas.data.map((entrega) => (
                                                <tr key={entrega.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        #{entrega.factura.numfactura}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div className="flex items-center">
                                                            <User className="h-4 w-4 mr-2 text-gray-400" />
                                                            {entrega.factura.cliente.nombre} {entrega.factura.cliente.apellido}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        <div>
                                                            <div className="font-medium">{entrega.articulo.articulo}</div>
                                                            <div className="text-gray-500">Cód: {entrega.articulo.codarticulo}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <span className="font-semibold">{entrega.cantidad}</span> unidades
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div className="flex items-center">
                                                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                            {new Date(entrega.fecha_entrega).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTipoVentaBadge(entrega.factura.tipo_venta)}`}>
                                                            {entrega.factura.tipo_venta === 'ecommerce' ? 'E-commerce' : 'POS'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(entrega.estado)}`}>
                                                            {entrega.estado.charAt(0).toUpperCase() + entrega.estado.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {entrega.estado === 'pendiente' && (
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => marcarEntregada(entrega.id)}
                                                                    title="Completar entrega"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => cancelarEntrega(entrega.id)}
                                                                    title="Cancelar entrega"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Paginación */}
                            {entregas.links && entregas.links.length > 3 && (
                                <div className="mt-4 flex justify-center">
                                    <nav className="flex gap-2">
                                        {entregas.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`px-3 py-1 text-sm rounded ${
                                                    link.active
                                                        ? 'bg-blue-600 text-white'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
