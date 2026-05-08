import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface Presupuesto {
    id: number;
    quote_number: number;
    total: number;
    subtotal: number;
    date: string;
    customer: {
        business_name: string;
        fantasy_name?: string | null;
    };
    user: {
        name: string;
    };
    products: Array<{
        id: number;
        name: string;
        sku: string;
        pivot: {
            quantity: number;
            unit_price: number;
            subtotal: number;
        };
    }>;
}

interface Props {
    presupuesto: Presupuesto;
}

export default function Show({ presupuesto }: Props) {
    return (
        <AppLayout>
            <Head title={`Presupuesto #${presupuesto.quote_number}`} />

            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Presupuesto #{presupuesto.quote_number}</h1>
                        <p className="text-gray-600">Detalles del presupuesto</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('presupuestos.index')}>
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Presupuesto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Cliente</label>
                                <p className="text-sm">{presupuesto.customer.fantasy_name || presupuesto.customer.business_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Vendedor</label>
                                <p className="text-sm">{presupuesto.user.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Fecha</label>
                                <p className="text-sm">{new Date(presupuesto.date).toLocaleDateString()}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Totales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Subtotal</label>
                                <p className="text-sm">${Number(presupuesto.subtotal).toFixed(2)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Total</label>
                                <p className="text-lg font-bold">${Number(presupuesto.total).toFixed(2)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Artículos</CardTitle>
                        <CardDescription>
                            {presupuesto.products.length} artículo{presupuesto.products.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Código</th>
                                        <th className="text-left p-2">Artículo</th>
                                        <th className="text-left p-2">Cantidad</th>
                                        <th className="text-left p-2">Precio Unit.</th>
                                        <th className="text-left p-2">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {presupuesto.products.map((p) => (
                                        <tr key={p.id} className="border-b">
                                            <td className="p-2 font-mono text-sm">{p.sku}</td>
                                            <td className="p-2 font-medium">{p.name}</td>
                                            <td className="p-2">{p.pivot.quantity}</td>
                                            <td className="p-2">${Number(p.pivot.unit_price).toFixed(2)}</td>
                                            <td className="p-2">${Number(p.pivot.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
