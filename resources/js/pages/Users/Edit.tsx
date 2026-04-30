import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';

interface User { id: number; name: string; email: string; role_id?: number; }
interface Role { id: number; role: string; }
interface Props { user: User; roles: Role[]; }

export default function Edit({ user, roles }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name, email: user.email, role_id: user.role_id?.toString() || '',
    });

    const submit = (e: React.FormEvent) => { e.preventDefault(); put(route('users.update', user.id)); };

    return (
        <AppLayout>
            <Head title="Editar Usuario" />
            <div className="p-6">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Editar Usuario</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Nombre" htmlFor="name" error={errors.name}>
                                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} />
                                </FormField>
                                <FormField label="Email" htmlFor="email" error={errors.email}>
                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                                </FormField>
                                <FormField label="Rol" error={errors.role_id} className="md:col-span-2">
                                    <Select value={data.role_id} onValueChange={(v) => setData('role_id', v)}>
                                        <SelectTrigger error={errors.role_id}><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                                        <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.role}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormField>
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
