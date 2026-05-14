import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';

interface Role {
    id: number;
    name: string;
    guard_name: string;
}

interface Props {
    role: Role;
}

export default function Edit({ role }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('roles.update', role.id));
    };

    return (
        <AppLayout>
            <Head title="Editar Rol" />

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Editar Rol</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <FormField label="Nombre del rol" htmlFor="name" error={errors.name}>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                            />
                        </FormField>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>
                                Actualizar
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
