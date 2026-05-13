import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from '@/components/form-field';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

interface Factura {
    id: number;
    invoice_number: number;
    date: string;
    subtotal: number;
    surcharge: number;
    additional_discount: number;
    total: number;
    cae?: string;
    customer: {
        business_name: string;
        fantasy_name?: string | null;
    };
    products: Array<{
        pivot: {
            name: string;
            quantity: number;
            unit_price: number;
            subtotal: number;
        };
    }>;
}

interface Props {
    factura: Factura;
}

export default function Edit({ factura }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        surcharge: factura.surcharge || 0,
        additional_discount: factura.additional_discount || 0,
    });

    const subtotal = Number(factura.products.reduce((sum, p) => sum + Number(p.pivot.subtotal), 0));
    const total = subtotal + Number(data.surcharge) - Number(data.additional_discount);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('ventas.update', factura.id));
    };

    return (
        <AppLayout>
            <Head title={`Editar Factura #${factura.invoice_number}`} />

            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={route('ventas.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Editar Factura #{factura.invoice_number}
                    </h1>
                </div>

                {factura.cae && (
                    <Alert variant="warning">
                        <AlertTriangle className="size-4" />
                        <AlertDescription>
                            Esta factura ya está autorizada en AFIP (CAE: {factura.cae}) y no puede ser editada.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de la Factura</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Cliente</Label>
                                <p className="text-sm text-gray-600">{factura.customer.fantasy_name || factura.customer.business_name}</p>
                            </div>
                            <div>
                                <Label>Fecha</Label>
                                <p className="text-sm text-gray-600">{new Date(factura.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <Label>Subtotal</Label>
                                <p className="text-sm font-semibold">${Number(subtotal).toFixed(2)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ajustar Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <FormField label="Recargo" htmlFor="surcharge" error={errors.surcharge}>
                                    <Input id="surcharge" type="text" min="0" value={data.surcharge.toString()} onChange={(e) => { const v = e.target.value; const n = v.includes('.') ? parseFloat(v) : parseFloat(v + '.00'); setData('surcharge', isNaN(n) ? 0 : n); }} disabled={!!factura.cae} placeholder="0.00" />
                                </FormField>
                                <FormField label="Descuento" htmlFor="additional_discount" error={errors.additional_discount}>
                                    <Input id="additional_discount" type="text" min="0" value={data.additional_discount.toString()} onChange={(e) => { const v = e.target.value; const n = v.includes('.') ? parseFloat(v) : parseFloat(v + '.00'); setData('additional_discount', isNaN(n) ? 0 : n); }} disabled={!!factura.cae} placeholder="0.00" />
                                </FormField>

                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-lg font-semibold">Total Final</Label>
                                        <span className="text-lg font-bold">${total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {!factura.cae && (
                                    <Button type="submit" disabled={processing} className="w-full">
                                        {processing ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Artículos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artículo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {factura.products.map((p, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{p.pivot.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{p.pivot.quantity}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">${p.pivot.unit_price}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">${p.pivot.subtotal}</td>
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
