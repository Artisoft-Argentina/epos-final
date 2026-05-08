import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Warehouse {
    id: number;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    notes: string | null;
    is_default: boolean;
    active: boolean;
}

export default function Edit({ warehouse }: { warehouse: Warehouse }) {
    const { data, setData, put, processing, errors } = useForm({
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address ?? '',
        phone: warehouse.phone ?? '',
        notes: warehouse.notes ?? '',
        is_default: warehouse.is_default,
        active: warehouse.active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('almacenes.update', warehouse.id));
    };

    return (
        <AppLayout>
            <Head title={`Editar ${warehouse.name}`} />
            <div className="p-6">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Editar Almacén</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <FormField label="Nombre" htmlFor="name" error={errors.name} required>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} />
                            </FormField>
                            <FormField label="Código" htmlFor="code" error={errors.code} required>
                                <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} error={errors.code} />
                            </FormField>
                            <FormField label="Dirección" htmlFor="address" error={errors.address}>
                                <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                            </FormField>
                            <FormField label="Teléfono" htmlFor="phone" error={errors.phone}>
                                <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} />
                            </FormField>
                            <div className="flex items-center gap-2">
                                <Switch id="is_default" checked={data.is_default} onCheckedChange={(v) => setData('is_default', v)} />
                                <Label htmlFor="is_default">Almacén por defecto</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id="active" checked={data.active} onCheckedChange={(v) => setData('active', v)} />
                                <Label htmlFor="active">Activo</Label>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>{processing ? 'Actualizando...' : 'Actualizar'}</Button>
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
