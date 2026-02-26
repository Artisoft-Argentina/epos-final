import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Building2 } from 'lucide-react';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function CentralLogin({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('central.login.store'));
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <Head title="Panel Central — Iniciar Sesión" />

            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel Central</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Administración de empresas</p>
                </div>

                {status && (
                    <div className="rounded-md bg-green-50 p-3 text-center text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900">
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoFocus
                            autoComplete="email"
                            placeholder="superadmin@ejemplo.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="current-password"
                            placeholder="••••••••"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing ? 'Ingresando...' : 'Ingresar'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
