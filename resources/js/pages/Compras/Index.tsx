import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, SquarePen, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

interface Supplier {
    id: number;
    razonsocial: string;
}

interface Detalle {
    id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

interface Compra {
    id: number;
    numero_remito: string;
    fecha: string;
    total: number;
    supplier: Supplier;
    detalles: Detalle[];
}

interface Props {
    compras: Compra[];
}

export default function Index({ compras }: Props) {
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
            <Head title="Compras" />
            
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Compras</h1>
                    <Link href={route('compras.create')}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Compra
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Compras</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {compras.map((compra) => (
                                <div key={compra.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">Orden #{compra.numero_remito}</h3>
                                            <p className="text-sm text-gray-600">{compra.supplier.razonsocial}</p>
                                            <p className="text-sm text-gray-500">{formatDate(compra.fecha)}</p>
                                            <p className="text-sm text-gray-500">{compra.detalles.length} artículos</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">{formatCurrency(compra.total)}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Link href={route('compras.show', compra.id)}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={route('compras.edit', compra.id)}>
                                                    <Button variant="outline" size="sm">
                                                        <SquarePen className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <DeleteConfirmationDialog
                                                    url={route('compras.destroy', compra.id)}
                                                    title="Eliminar Compra"
                                                    description="¿Estás seguro de que deseas eliminar esta compra? Esta acción no se puede deshacer."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {compras.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No hay compras registradas.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}