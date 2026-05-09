import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Save, X } from 'lucide-react';

interface Factura {
    id: number;
    invoice_number: number;
    total: number;
    customer: {
        business_name: string;
        fantasy_name?: string | null;
    };
    payments: Array<{
        id: number;
        amount: number;
        payment_method: string;
        payment_date: string;
    }>;
}

interface Props {
    factura: Factura;
}

export default function Create({ factura }: Props) {
    const totalPagado = factura.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const saldoPendiente = Number(factura.total) - totalPagado;

    const { data, setData, post, processing, errors } = useForm({
        amount: saldoPendiente.toString(),
        payment_method: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('pagos.store', factura.id));
    };

    return (
        <AppLayout>
            <Head title="Registrar Pago" />

            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Registrar Pago</h1>
                    <p className="text-gray-600">Factura #{factura.invoice_number} - {factura.customer.fantasy_name || factura.customer.business_name}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información de la Factura */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de la Factura</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Total Factura</Label>
                                    <p className="text-lg font-semibold">${Number(factura.total).toFixed(2)}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Total Pagado</Label>
                                    <p className="text-lg font-semibold text-green-600">${totalPagado.toFixed(2)}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Saldo Pendiente</Label>
                                <p className="text-xl font-bold text-red-600">${saldoPendiente.toFixed(2)}</p>
                            </div>

                            {factura.payments.length > 0 && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-500 mb-2 block">Pagos Anteriores</Label>
                                    <div className="space-y-2">
                                        {factura.payments.map((pago) => (
                                            <div key={pago.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{pago.payment_method}</span>
                                                <span className="font-medium">${Number(pago.amount).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Formulario de Pago */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Nuevo Pago</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <Label htmlFor="amount">Monto *</Label>
                                    <Input
                                        id="amount"
                                        type="text"
                                        value={data.amount}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                            const parts = value.split('.');
                                            if (parts.length > 2) return;
                                            if (parts[1] && parts[1].length > 2) return;
                                            setData('amount', value);
                                        }}
                                        onBlur={(e) => {
                                            const num = parseFloat(e.target.value) || 0;
                                            setData('amount', num.toFixed(2));
                                        }}
                                        error={errors.amount}
                                        placeholder={`Máximo: $${saldoPendiente.toFixed(2)}`}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="payment_method">Método de Pago *</Label>
                                    <Select value={data.payment_method} onValueChange={(value) => setData('payment_method', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar método" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="efectivo">Efectivo</SelectItem>
                                            <SelectItem value="tarjeta_debito">Tarjeta de Débito</SelectItem>
                                            <SelectItem value="tarjeta_credito">Tarjeta de Crédito</SelectItem>
                                            <SelectItem value="transferencia">Transferencia</SelectItem>
                                            <SelectItem value="mercadopago">MercadoPago</SelectItem>
                                            <SelectItem value="cheque">Cheque</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.payment_method && <p className="text-sm text-red-600 mt-1">{errors.payment_method}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="payment_date">Fecha de Pago *</Label>
                                    <Input
                                        id="payment_date"
                                        type="date"
                                        value={data.payment_date}
                                        onChange={(e) => setData('payment_date', e.target.value)}
                                        error={errors.payment_date}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="notes">Observaciones</Label>
                                    <Input
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Observaciones adicionales..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button type="submit" disabled={processing}>
                                        <Save className="w-4 h-4 mr-2" />
                                        {processing ? 'Registrando...' : 'Registrar Pago'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                        <X className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
