import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Categoria {
    id: number;
    name: string;
}

interface Props {
    categoria: Categoria;
}

export default function Edit({ categoria }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: categoria.name,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('categorias.update', categoria.id));
    };

    return (
        <AppLayout>
            <Head title="Editar Categoría" />
            
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Editar Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nombre *</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                placeholder="Ingrese el nombre de la categoría"
                            />
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