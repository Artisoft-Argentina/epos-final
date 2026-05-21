import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        address: '',
        phone: '',
        notes: '',
        is_default: false,
        active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('almacenes.store'));
    };

    return (
        <AppLayout>
            <Head title="Crear Almacén" />
            <div className="p-6">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Crear Nuevo Almacén</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <FormField label="Nombre" htmlFor="name" error={errors.name} required>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Ej: Sucursal Centro" error={errors.name} />
                            </FormField>
                            <FormField label="Código" htmlFor="code" error={errors.code} required>
                                <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} placeholder="Ej: CENTRO" error={errors.code} />
                            </FormField>
                            <FormField label="Dirección" htmlFor="address" error={errors.address}>
                                <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                            </FormField>
                            <FormField label="Teléfono" htmlFor="phone" error={errors.phone}>
                                <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} />
                            </FormField>
                            <div className="flex items-center gap-2">
                                <Switch id="is_default" checked={data.is_default} onCheckedChange={(v) => setData('is_default', v)} />
                                <Label htmlFor="is_default">Marcar como almacén por defecto</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id="active" checked={data.active} onCheckedChange={(v) => setData('active', v)} />
                                <Label htmlFor="active">Activo</Label>
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
