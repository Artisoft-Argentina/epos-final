import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Factura {
    id: number;
    numfactura: string;
    fecha: string;
    total: number;
    pagada: boolean;
    articulos: Array<{
        id: number;
        articulo: string;
        pivot: {
            cantidad: number;
            preciounitario: number;
            subtotal: number;
        };
    }>;
}

interface Props {
    facturas: Factura[];
}

export default function UserPurchases({ facturas }: Props) {
    return (
        <AppLayout>
            <Head title="Mis Compras" />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Mis Compras</h1>
                
                {facturas.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-gray-500">No tienes compras registradas</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {facturas.map((factura) => (
                            <Card key={factura.id}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span>Factura #{factura.numfactura}</span>
                                        <span className="text-sm font-normal text-gray-500">
                                            {new Date(factura.fecha).toLocaleDateString()}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {factura.articulos.map((articulo) => (
                                            <div key={articulo.id} className="flex justify-between items-center border-b pb-2">
                                                <div>
                                                    <p className="font-medium">{articulo.articulo}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Cantidad: {articulo.pivot.cantidad}
                                                    </p>
                                                </div>
                                                <span className="font-bold">
                                                    ${articulo.pivot.subtotal.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-4 border-t-2">
                                            <span className="text-xl font-bold">Total:</span>
                                            <span className="text-xl font-bold">
                                                ${factura.total.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Estado:</span>
                                            <span className={`px-3 py-1 rounded ${
                                                factura.pagada 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {factura.pagada ? 'Pagada' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
