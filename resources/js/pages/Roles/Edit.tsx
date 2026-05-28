import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { PermissionSelector } from '@/components/permission-selector';

interface Role {
    id: number;
    name: string;
    guard_name: string;
}

interface Props {
    role: Role;
    permissions: string[];
    rolePermissions: string[];
}

export default function Edit({ role, permissions, rolePermissions }: Props) {
    const { data, setData, put, processing, errors } = useForm<{ name: string; permissions: string[] }>({
        name: role.name,
        permissions: rolePermissions,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('roles.update', role.id));
    };

    return (
        <AppLayout>
            <Head title="Editar Rol" />
            <div className="p-6">
                <form onSubmit={submit} className="space-y-6 max-w-3xl">
                    <Card>
                        <CardHeader><CardTitle>Editar Rol</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Nombre del rol" htmlFor="name" error={errors.name}>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
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
                        <Button type="submit" disabled={processing}>Actualizar Rol</Button>
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
