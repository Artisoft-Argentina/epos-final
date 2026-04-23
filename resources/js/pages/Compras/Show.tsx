import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, SquarePen } from 'lucide-react';

interface Supplier {
    id: number;
    razonsocial: string;
    cuit: string;
}

interface Articulo {
    id: number;
    codarticulo: string;
    articulo: string;
}

interface Detalle {
    id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    articulo: Articulo;
}

interface Compra {
    id: number;
    numero_remito: string;
    fecha: string;
    subtotal: number;
    total: number;
    observaciones: string;
    supplier: Supplier;
    detalles: Detalle[];
}

interface Props {
    compra: Compra;
}

export default function Show({ compra }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-AR');
    };

    return (
        <AppLayout>
            <Head title={`Compra - Orden #${compra.numero_remito}`} />
            
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href={route('compras.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Orden #{compra.numero_remito}</h1>
                            <p className="text-gray-600">{formatDate(compra.fecha)}</p>
                        </div>
                    </div>
                    <Link href={route('compras.edit', compra.id)}>
                        <Button>
                            <SquarePen className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Artículos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {compra.detalles.map((detalle) => (
                                        <div key={detalle.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold">{detalle.articulo.articulo}</h3>
                                                    <p className="text-sm text-gray-600">Código: {detalle.articulo.codarticulo}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Cantidad: {detalle.cantidad} × {formatCurrency(detalle.precio_unitario)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{formatCurrency(detalle.subtotal)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Proveedor</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div>
                                        <p className="font-semibold">{compra.supplier.razonsocial}</p>
                                        <p className="text-sm text-gray-600">CUIT: {compra.supplier.cuit}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(compra.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                                        <span>Total:</span>
                                        <span>{formatCurrency(compra.total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {compra.observaciones && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Observaciones</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{compra.observaciones}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}