import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, DollarSign, Trash2, Package } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

interface Sale {
    id: number;
    invoice_number: number;
    total: number;
    subtotal: number;
    surcharge?: number;
    additional_discount?: number;
    date: string;
    payment_status: string;
    total_paid: number;
    pending_balance: number;
    cae?: string;
    cae_expiration?: string;
    afip_authorized?: boolean;
    customer: { business_name: string; };
    user: { name: string; };
    products: Array<{
        id: number;
        name: string;
        sku: string;
        pivot: { quantity: number; unit_price: number; subtotal: number; };
    }>;
    payments: Array<{
        id: number;
        amount: number;
        payment_method: string;
        payment_date: string;
        notes?: string;
    }>;
    deliveries: Array<{
        id: number;
        product_id: number;
        quantity: number;
        delivery_date: string;
        notes?: string;
        product: { sku: string; name: string; };
    }>;
}

interface Props { factura: Sale; }

const metodoPagoLabels = {
    efectivo: 'Efectivo',
    tarjeta_debito: 'Tarjeta de Débito',
    tarjeta_credito: 'Tarjeta de Crédito',
    transferencia: 'Transferencia',
    mercadopago: 'MercadoPago',
    cheque: 'Cheque'
};

export default function Show({ factura }: Props) {
    const totalPagado = factura.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const saldoPendiente = Number(factura.total) - totalPagado;

    return (
        <AppLayout>
            <Head title={`Venta #${factura.invoice_number}`} />
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Venta #{factura.invoice_number}</h1>
                        <p className="text-gray-600">Detalles de la venta</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('ventas.index')}>
                            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
                        </Link>
                        {(() => {
                            const totalVendido = factura.products?.reduce((sum, p) => sum + p.pivot.quantity, 0) || 0;
                            const totalEntregado = factura.deliveries?.reduce((sum, d) => sum + d.quantity, 0) || 0;
                            return totalEntregado < totalVendido;
                        })() && (
                            <Link href={route('entregas.create', factura.id)}>
                                <Button variant="outline"><Package className="w-4 h-4 mr-2" />Registrar Entrega</Button>
                            </Link>
                        )}
                        {saldoPendiente > 0 && (
                            <Link href={route('pagos.create', factura.id)}>
                                <Button><DollarSign className="w-4 h-4 mr-2" />Registrar Pago</Button>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <CardHeader><CardTitle>Información de la Venta</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div><label className="text-sm font-medium text-gray-500">Cliente</label><p className="text-sm">{factura.customer.business_name}</p></div>
                            <div><label className="text-sm font-medium text-gray-500">Vendedor</label><p className="text-sm">{factura.user.name}</p></div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Estado</label>
                                <p className="text-sm">
                                    <span className={`px-2 py-1 rounded text-xs ${factura.payment_status === 'SI' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {factura.payment_status === 'SI' ? 'Pagada' : 'Pendiente'}
                                    </span>
                                </p>
                            </div>
                            <div><label className="text-sm font-medium text-gray-500">Fecha</label><p className="text-sm">{new Date(factura.date).toLocaleDateString()}</p></div>
                            {factura.cae && <div><label className="text-sm font-medium text-gray-500">CAE</label><p className="text-sm font-mono">{factura.cae}</p></div>}
                            {factura.cae_expiration && <div><label className="text-sm font-medium text-gray-500">Vencimiento CAE</label><p className="text-sm">{factura.cae_expiration}</p></div>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Totales</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div><label className="text-sm font-medium text-gray-500">Subtotal</label><p className="text-sm">${Number(factura.subtotal).toFixed(2)}</p></div>
                            {factura.surcharge && Number(factura.surcharge) > 0 && <div><label className="text-sm font-medium text-gray-500">Recargo</label><p className="text-sm text-orange-600">+${Number(factura.surcharge).toFixed(2)}</p></div>}
                            {factura.additional_discount && Number(factura.additional_discount) > 0 && <div><label className="text-sm font-medium text-gray-500">Descuento</label><p className="text-sm text-green-600">-${Number(factura.additional_discount).toFixed(2)}</p></div>}
                            <div><label className="text-sm font-medium text-gray-500">Total</label><p className="text-lg font-bold">${Number(factura.total).toFixed(2)}</p></div>
                            <div><label className="text-sm font-medium text-gray-500">Total Pagado</label><p className="text-sm font-semibold text-green-600">${totalPagado.toFixed(2)}</p></div>
                            {saldoPendiente > 0 && <div><label className="text-sm font-medium text-gray-500">Saldo Pendiente</label><p className="text-lg font-bold text-red-600">${saldoPendiente.toFixed(2)}</p></div>}
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Artículos</CardTitle>
                        <CardDescription>{factura.products.length} artículo{factura.products.length !== 1 ? 's' : ''}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead><tr className="border-b"><th className="text-left p-2">SKU</th><th className="text-left p-2">Artículo</th><th className="text-left p-2">Cantidad</th><th className="text-left p-2">Precio Unit.</th><th className="text-left p-2">Subtotal</th></tr></thead>
                                <tbody>
                                    {factura.products.map((product) => (
                                        <tr key={product.id} className="border-b">
                                            <td className="p-2 font-mono text-sm">{product.sku}</td>
                                            <td className="p-2 font-medium">{product.name}</td>
                                            <td className="p-2">{product.pivot.quantity}</td>
                                            <td className="p-2">${Number(product.pivot.unit_price).toFixed(2)}</td>
                                            <td className="p-2">${Number(product.pivot.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {factura.payments && factura.payments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Pagos Realizados</CardTitle>
                            <CardDescription>{factura.payments.length} pago{factura.payments.length !== 1 ? 's' : ''}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b"><th className="text-left p-2">Monto</th><th className="text-left p-2">Método</th><th className="text-left p-2">Fecha</th><th className="text-left p-2">Notas</th><th className="text-right p-2">Acciones</th></tr></thead>
                                    <tbody>
                                        {factura.payments.map((payment) => (
                                            <tr key={payment.id} className="border-b">
                                                <td className="p-2 font-medium">${Number(payment.amount).toFixed(2)}</td>
                                                <td className="p-2">{metodoPagoLabels[payment.payment_method as keyof typeof metodoPagoLabels] || payment.payment_method}</td>
                                                <td className="p-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                                <td className="p-2">{payment.notes || '-'}</td>
                                                <td className="p-2 text-right">
                                                    <DeleteConfirmationDialog
                                                        url={route('pagos.destroy', payment.id)}
                                                        title="Eliminar pago"
                                                        description={`¿Está seguro que desea eliminar este pago de $${Number(payment.amount).toFixed(2)}?`}
                                                        trigger={<Button variant="outline" size="sm"><Trash2 className="w-4 h-4" /></Button>}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {factura.deliveries && factura.deliveries.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Entregas Realizadas</CardTitle>
                            <CardDescription>{factura.deliveries.length} entrega{factura.deliveries.length !== 1 ? 's' : ''}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b"><th className="text-left p-2">SKU</th><th className="text-left p-2">Artículo</th><th className="text-left p-2">Cantidad</th><th className="text-left p-2">Fecha</th><th className="text-left p-2">Notas</th><th className="text-right p-2">Acciones</th></tr></thead>
                                    <tbody>
                                        {factura.deliveries.map((delivery) => (
                                            <tr key={delivery.id} className="border-b">
                                                <td className="p-2 font-mono text-sm">{delivery.product.sku}</td>
                                                <td className="p-2 font-medium">{delivery.product.name}</td>
                                                <td className="p-2">{delivery.quantity}</td>
                                                <td className="p-2">{new Date(delivery.delivery_date).toLocaleDateString()}</td>
                                                <td className="p-2">{delivery.notes || '-'}</td>
                                                <td className="p-2 text-right">
                                                    <DeleteConfirmationDialog
                                                        url={route('entregas.destroy', delivery.id)}
                                                        title="Eliminar entrega"
                                                        description={`¿Está seguro que desea eliminar esta entrega de ${delivery.quantity} unidades?`}
                                                        trigger={<Button variant="outline" size="sm"><Trash2 className="w-4 h-4" /></Button>}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}