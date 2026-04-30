import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({ name: '' });
    const submit = (e: React.FormEvent) => { e.preventDefault(); post(route('categorias.store')); };

    return (
        <AppLayout>
            <Head title="Crear Categoría" />
            <div className="p-6">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Crear Nueva Categoría</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <FormField label="Nombre" htmlFor="name" error={errors.name} required>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Ingrese el nombre de la categoría" error={errors.name} />
                            </FormField>
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