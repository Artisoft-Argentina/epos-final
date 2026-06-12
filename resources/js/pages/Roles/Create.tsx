import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { PermissionSelector } from '@/components/permission-selector';

interface Props {
    permissions: string[];
}

export default function Create({ permissions }: Props) {
    const { data, setData, post, processing, errors } = useForm<{ name: string; permissions: string[] }>({
        name: '',
        permissions: [],
    });

    const submit = (e: React.FormEvent) => { e.preventDefault(); post(route('roles.store')); };

    return (
        <AppLayout>
            <Head title="Crear Rol" />
            <div className="p-6">
                <form onSubmit={submit} className="space-y-6 max-w-3xl">
                    <Card>
                        <CardHeader><CardTitle>Crear Nuevo Rol</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Nombre del rol" htmlFor="name" error={errors.name}>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                    placeholder="Ej: supervisor"
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Permisos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PermissionSelector
                                permissions={permissions}
                                selected={data.permissions}
                                onChange={(val) => setData('permissions', val)}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>Crear Rol</Button>
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
