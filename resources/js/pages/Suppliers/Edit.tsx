import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Supplier {
    id: number;
    business_name: string;
    tax_id: string;
    address: string;
    phone: string;
    email?: string;
}

interface Props {
    supplier: Supplier;
}

export default function Edit({ supplier }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        business_name: supplier.business_name,
        tax_id: supplier.tax_id.toString(),
        address: supplier.address,
        phone: supplier.phone,
        email: supplier.email || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('suppliers.update', supplier.id));
    };

    return (
        <AppLayout>
            <Head title="Editar Proveedor" />
            
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Editar Proveedor</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="business_name">Razón Social *</Label>
                                <Input
                                    id="business_name"
                                    value={data.business_name}
                                    onChange={(e) => setData('business_name', e.target.value)}
                                    error={errors.business_name}
                                />
                            </div>
                            <div>
                                <Label htmlFor="tax_id">CUIT *</Label>
                                <Input
                                    id="tax_id"
                                    value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                    error={errors.tax_id}
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Teléfono *</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    error={errors.phone}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="address">Dirección *</Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    error={errors.address}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Actualizando...' : 'Actualizar'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}