import CentralLayout from '@/layouts/central-layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { FormEventHandler } from 'react';

export default function CreateTenant() {
    const { data, setData, post, processing, errors } = useForm({
        razonsocial: '',
        cuit: '',
        slug: '',
        plan: 'basic' as 'basic' | 'pro' | 'enterprise',
        admin_name: '',
        admin_email: '',
        admin_password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('central.tenants.store'));
    };

    const slugPreview = data.slug ? `${data.slug}.${window.location.hostname}` : '';

    return (
        <CentralLayout title="Nueva Empresa">
            <Head title="Nueva Empresa — Panel Central" />

            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
                {/* Datos de la empresa */}
                <section className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900">
                    <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Datos de la empresa</h2>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="razonsocial">Razón Social *</Label>
                            <Input
                                id="razonsocial"
                                value={data.razonsocial}
                                onChange={(e) => setData('razonsocial', e.target.value)}
                                placeholder="Empresa SA"
                            />
                            <InputError message={errors.razonsocial} />
                        </div>
                        <div>
                            <Label htmlFor="cuit">CUIT *</Label>
                            <Input
                                id="cuit"
                                value={data.cuit}
                                onChange={(e) => setData('cuit', e.target.value)}
                                placeholder="20123456789"
                            />
                            <InputError message={errors.cuit} />
                        </div>
                        <div>
                            <Label htmlFor="slug">Subdominio *</Label>
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                placeholder="empresa1"
                            />
                            {slugPreview && (
                                <p className="mt-1 text-xs text-gray-400">URL: <span className="font-mono text-blue-600">{slugPreview}</span></p>
                            )}
                            <InputError message={errors.slug} />
                        </div>
                        <div>
                            <Label htmlFor="plan">Plan *</Label>
                            <select
                                id="plan"
                                value={data.plan}
                                onChange={(e) => setData('plan', e.target.value as any)}
                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="basic">Básico</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                            <InputError message={errors.plan} />
                        </div>
                    </div>
                </section>

                {/* Primer usuario admin */}
                <section className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900">
                    <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Primer usuario administrador</h2>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="admin_name">Nombre *</Label>
                            <Input
                                id="admin_name"
                                value={data.admin_name}
                                onChange={(e) => setData('admin_name', e.target.value)}
                                placeholder="Juan García"
                            />
                            <InputError message={errors.admin_name} />
                        </div>
                        <div>
                            <Label htmlFor="admin_email">Email *</Label>
                            <Input
                                id="admin_email"
                                type="email"
                                value={data.admin_email}
                                onChange={(e) => setData('admin_email', e.target.value)}
                                placeholder="admin@empresa.com"
                            />
                            <InputError message={errors.admin_email} />
                        </div>
                        <div>
                            <Label htmlFor="admin_password">Contraseña inicial *</Label>
                            <Input
                                id="admin_password"
                                type="password"
                                value={data.admin_password}
                                onChange={(e) => setData('admin_password', e.target.value)}
                                placeholder="Mín. 8 caracteres"
                            />
                            <InputError message={errors.admin_password} />
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => history.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Creando empresa...' : 'Crear empresa'}
                    </Button>
                </div>
            </form>
        </CentralLayout>
    );
}
