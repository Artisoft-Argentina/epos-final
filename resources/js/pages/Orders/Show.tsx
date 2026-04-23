import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package } from 'lucide-react';

interface Supplier {
    id: number;
    business_name: string;
    tax_id: string;
}

interface Product {
    id: number;
    sku: string;
    name: string;
}

interface OrderProduct {
    id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product: Product;
}

interface Order {
    id: number;
    pos_number: number;
    order_number: number;
    date: string;
    subtotal: number;
    total: number;
    converted_to_inventory: boolean;
    supplier: Supplier;
    products: OrderProduct[];
}

interface Props {
    order: Order;
}

export default function Show({ order }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-AR');
    };

    const numeroCompleto = `${order.pos_number.toString().padStart(4, '0')}-${order.order_number.toString().padStart(8, '0')}`;

    return (
        <AppLayout>
            <Head title={`Orden ${numeroCompleto}`} />
            
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={route('orders.index')} className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-sm hover:bg-accent">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Orden {numeroCompleto}</h1>
                        <p className="text-gray-600">{formatDate(order.date)}</p>
                        {order.converted_to_inventory && (
                            <p className="text-green-600 font-semibold">✓ Convertido a inventario</p>
                        )}
                    </div>
                </div>
                
                {!order.converted_to_inventory && (
                    <div className="mb-6">
                        <Link href={route('orders.convert-inventory', order.id)} method="post" as="button" className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                            <Package className="h-4 w-4" />
                            Convertir a Inventario
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Artículos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.products.map((item) => (
                                        <div key={item.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold">{item.product.name}</h3>
                                                    <p className="text-sm text-gray-600">Código: {item.product.sku}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Cantidad: {item.quantity} × {formatCurrency(item.unit_price)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{formatCurrency(item.subtotal)}</p>
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
                                        <p className="font-semibold">{order.supplier.business_name}</p>
                                        <p className="text-sm text-gray-600">CUIT: {order.supplier.tax_id}</p>
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
                                        <span>{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                                        <span>Total:</span>
                                        <span>{formatCurrency(order.total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
