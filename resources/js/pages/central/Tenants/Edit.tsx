import CentralLayout from '@/layouts/central-layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Tenant {
    id: string;
    razonsocial: string;
    cuit: string;
    plan: string;
}

export default function EditTenant({ tenant }: { tenant: Tenant }) {
    const { data, setData, put, processing, errors } = useForm({
        razonsocial: tenant.razonsocial,
        cuit: tenant.cuit,
        plan: tenant.plan as 'basic' | 'pro' | 'enterprise',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('central.tenants.update', tenant.id));
    };

    return (
        <CentralLayout title="Editar Empresa">
            <Head title="Editar Empresa — Panel Central" />

            <div className="mb-6">
                <Link href={route('central.tenants.show', tenant.id)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Link>
            </div>

            <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900">
                <div>
                    <Label htmlFor="razonsocial">Razón Social</Label>
                    <Input id="razonsocial" value={data.razonsocial} onChange={(e) => setData('razonsocial', e.target.value)} />
                    <InputError message={errors.razonsocial} />
                </div>
                <div>
                    <Label htmlFor="cuit">CUIT</Label>
                    <Input id="cuit" value={data.cuit} onChange={(e) => setData('cuit', e.target.value)} />
                    <InputError message={errors.cuit} />
                </div>
                <div>
                    <Label htmlFor="plan">Plan</Label>
                    <select
                        id="plan"
                        value={data.plan}
                        onChange={(e) => setData('plan', e.target.value as any)}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="basic">Básico</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                    <InputError message={errors.plan} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => history.back()}>Cancelar</Button>
                    <Button type="submit" disabled={processing}>{processing ? 'Guardando...' : 'Guardar cambios'}</Button>
                </div>
            </form>
        </CentralLayout>
    );
}
