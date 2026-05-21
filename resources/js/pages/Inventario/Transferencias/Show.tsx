import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, Truck, PackageCheck, X } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    code?: string;
}

interface TransferItem {
    id: number;
    product_id: number;
    product: Product;
    quantity: number;
    received_quantity: number | null;
}

interface Warehouse {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface Transfer {
    id: number;
    transfer_number: number;
    date: string;
    status: 'draft' | 'in_transit' | 'received' | 'cancelled';
    origin_warehouse: Warehouse;
    destination_warehouse: Warehouse;
    requested_by: User;
    received_by: User | null;
    items: TransferItem[];
    notes: string | null;
}

interface Props {
    transfer: Transfer;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    draft: { label: 'Borrador', variant: 'secondary' },
    in_transit: { label: 'En tránsito', variant: 'default' },
    received: { label: 'Recibida', variant: 'outline' },
    cancelled: { label: 'Cancelada', variant: 'destructive' },
};

export default function Show({ transfer }: Props) {
    const s = statusConfig[transfer.status];

    const handleDispatch = () => {
        if (confirm('¿Despachar esta transferencia? Se descontará el stock del almacén origen.')) {
            router.post(route('transferencias.dispatch', transfer.id));
        }
    };

    const handleReceive = () => {
        if (confirm('¿Confirmar recepción? Se sumará el stock al almacén destino.')) {
            router.post(route('transferencias.receive', transfer.id));
        }
    };

    const handleCancel = () => {
        if (confirm('¿Cancelar esta transferencia?')) {
            router.post(route('transferencias.cancel', transfer.id));
        }
    };

    return (
        <AppLayout>
            <Head title={`Transferencia #${transfer.transfer_number}`} />
            <div className="flex flex-col gap-6 p-6 max-w-3xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Transferencia <span className="font-mono">T-{String(transfer.transfer_number).padStart(5, '0')}</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">{transfer.date}</p>
                    </div>
                    <Badge variant={s?.variant} className="text-sm">{s?.label}</Badge>
                </div>

                <Card>
                    <CardHeader><CardTitle className="text-base">Detalle</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-32">Origen:</span>
                            <span className="font-medium">{transfer.origin_warehouse.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-32">Destino:</span>
                            <span className="font-medium">{transfer.destination_warehouse.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-32">Solicitado por:</span>
                            <span>{transfer.requested_by.name}</span>
                        </div>
                        {transfer.received_by && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground w-32">Recibido por:</span>
                                <span>{transfer.received_by.name}</span>
                            </div>
                        )}
                        {transfer.notes && (
                            <div className="flex items-start gap-2">
                                <span className="text-muted-foreground w-32">Notas:</span>
                                <span>{transfer.notes}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">Ítems</CardTitle></CardHeader>
                    <CardContent>
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-3 py-2">Producto</th>
                                    <th className="text-center px-3 py-2 w-28">Cantidad</th>
                                    {transfer.status === 'received' && (
                                        <th className="text-center px-3 py-2 w-28">Recibido</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {transfer.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2">
                                            <span className="font-medium">{item.product.name}</span>
                                            {item.product.code && (
                                                <span className="ml-2 text-xs text-muted-foreground font-mono">{item.product.code}</span>
                                            )}
                                        </td>
                                        <td className="text-center px-3 py-2">{item.quantity}</td>
                                        {transfer.status === 'received' && (
                                            <td className="text-center px-3 py-2">{item.received_quantity ?? '-'}</td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Acciones según estado */}
                <div className="flex gap-2">
                    {transfer.status === 'draft' && (
                        <>
                            <Button onClick={handleDispatch}>
                                <Truck className="size-4 mr-1" /> Despachar
                            </Button>
                            <Button variant="destructive" onClick={handleCancel}>
                                <X className="size-4 mr-1" /> Cancelar
                            </Button>
                        </>
                    )}
                    {transfer.status === 'in_transit' && (
                        <>
                            <Button onClick={handleReceive}>
                                <PackageCheck className="size-4 mr-1" /> Confirmar Recepción
                            </Button>
                            <Button variant="destructive" onClick={handleCancel}>
                                <X className="size-4 mr-1" /> Cancelar
                            </Button>
                        </>
                    )}
                    <Button variant="outline" onClick={() => window.history.back()}>Volver</Button>
                </div>
            </div>
        </AppLayout>
    );
}
