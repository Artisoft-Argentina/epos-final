import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        business_name: '', tax_id: '', address: '', phone: '', email: '',
    });

    const submit = (e: React.FormEvent) => { e.preventDefault(); post(route('suppliers.store')); };

    return (
        <AppLayout>
            <Head title="Crear Proveedor" />
            <div className="p-6">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Crear Nuevo Proveedor</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Razón Social" htmlFor="business_name" error={errors.business_name} required className="md:col-span-2">
                                    <Input id="business_name" value={data.business_name} onChange={(e) => setData('business_name', e.target.value)} error={errors.business_name} placeholder="Ej: Distribuidora Norte S.A." />
                                </FormField>
                                <FormField label="CUIT" htmlFor="tax_id" error={errors.tax_id} required>
                                    <Input id="tax_id" value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value)} error={errors.tax_id} placeholder="20123456789" />
                                </FormField>
                                <FormField label="Teléfono" htmlFor="phone" error={errors.phone} required>
                                    <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} placeholder="Ej: 11 1234-5678" />
                                </FormField>
                                <FormField label="Dirección" htmlFor="address" error={errors.address} required className="md:col-span-2">
                                    <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} placeholder="Ej: Av. Corrientes 1234" />
                                </FormField>
                                <FormField label="Email" htmlFor="email" error={errors.email} className="md:col-span-2">
                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} placeholder="proveedor@empresa.com" />
                                </FormField>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>{processing ? 'Creando...' : 'Crear'}</Button>
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
