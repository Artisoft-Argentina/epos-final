import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        role: '', permission: '', description: '',
    });

    const submit = (e: React.FormEvent) => { e.preventDefault(); post(route('roles.store')); };

    return (
        <AppLayout>
            <Head title="Crear Rol" />
            <div className="p-6">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Crear Nuevo Rol</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <FormField label="Rol" htmlFor="role" error={errors.role}>
                                <Input id="role" value={data.role} onChange={(e) => setData('role', e.target.value)} error={errors.role} placeholder="Ej: vendedor" />
                            </FormField>
                            <FormField label="Permisos" htmlFor="permission" error={errors.permission}>
                                <Input id="permission" value={data.permission} onChange={(e) => setData('permission', e.target.value)} error={errors.permission} placeholder="Ej: ventas,clientes" />
                            </FormField>
                            <FormField label="Descripción" htmlFor="description" error={errors.description}>
                                <Input id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} error={errors.description} placeholder="Descripción del rol" />
                            </FormField>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>Crear</Button>
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
