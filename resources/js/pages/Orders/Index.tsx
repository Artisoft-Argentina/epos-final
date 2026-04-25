import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, SquarePen } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

interface Supplier {
    id: number;
    business_name: string;
}

interface Order {
    id: number;
    pos_number: number;
    order_number: number;
    date: string;
    total: number;
    supplier: Supplier;
    products: { id: number }[];
}

interface Props {
    orders: Order[];
}

export default function Index({ orders }: Props) {
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
            <Head title="Órdenes de Compra" />

            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
                    <Link href={route('orders.create')}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Orden
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Órdenes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">
                                                Orden {order.pos_number.toString().padStart(4, '0')}-{order.order_number.toString().padStart(8, '0')}
                                            </h3>
                                            <p className="text-sm text-gray-600">{order.supplier?.business_name}</p>
                                            <p className="text-sm text-gray-500">{formatDate(order.date)}</p>
                                            <p className="text-sm text-gray-500">{order.products?.length ?? 0} artículos</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Link href={route('orders.show', order.id)}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={route('orders.edit', order.id)}>
                                                    <Button variant="outline" size="sm">
                                                        <SquarePen className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <DeleteConfirmationDialog
                                                    url={route('orders.destroy', order.id)}
                                                    title="Eliminar Orden"
                                                    description="¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {orders.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No hay órdenes registradas.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
