import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';

interface Role { id: number; role: string; }
interface PuntoVenta { id: number; name: string; pos_number: number; is_default: boolean; }
interface Props { roles: Role[]; puntosVenta: PuntoVenta[]; }

export default function Create({ roles, puntosVenta }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '', email: '', password: '', role_id: '', point_of_sale_id: '',
    });

    const selectedRole = roles.find((r) => r.id.toString() === data.role_id);
    const isVendedor = selectedRole?.role === 'vendedor';

    const submit = (e: React.FormEvent) => { e.preventDefault(); post(route('users.store')); };

    return (
        <AppLayout>
            <Head title="Crear Usuario" />
            <div className="p-6">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Crear Nuevo Usuario</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Nombre completo" htmlFor="name" error={errors.name}>
                                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Ingrese el nombre" error={errors.name} />
                                </FormField>
                                <FormField label="Email" htmlFor="email" error={errors.email}>
                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="usuario@ejemplo.com" error={errors.email} />
                                </FormField>
                                <FormField label="Contraseña" htmlFor="password" error={errors.password}>
                                    <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="Mínimo 8 caracteres" error={errors.password} />
                                </FormField>
                                <FormField label="Rol" error={errors.role_id}>
                                    <Select value={data.role_id} onValueChange={(v) => { setData('role_id', v); setData('point_of_sale_id', ''); }}>
                                        <SelectTrigger error={errors.role_id}><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                                        <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.role}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormField>
                                {isVendedor && (
                                    <FormField label="Punto de venta asignado *" error={errors.point_of_sale_id}>
                                        <Select value={data.point_of_sale_id} onValueChange={(v) => setData('point_of_sale_id', v)}>
                                            <SelectTrigger error={errors.point_of_sale_id}><SelectValue placeholder="Seleccionar PV" /></SelectTrigger>
                                            <SelectContent>
                                                {puntosVenta.map((p) => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>
                                                        {p.name} (#{p.pos_number}){p.is_default ? ' — default' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                )}
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
