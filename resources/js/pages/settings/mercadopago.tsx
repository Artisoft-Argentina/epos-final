import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { useForm, Head } from '@inertiajs/react';
import { CheckCircle, ExternalLink } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'MercadoPago', href: '/settings/mercadopago' },
];

interface Props {
    config?: {
        public_key?: string;
        ambiente?: 'sandbox' | 'production';
        configured?: boolean;
        token_hint?: string;
    };
}

export default function MercadoPago({ config }: Props) {
    const { data, setData, post, processing, recentlySuccessful, errors } = useForm({
        access_token: '',
        public_key: config?.public_key ?? '',
        ambiente: config?.ambiente ?? 'sandbox',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('mercadopago.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="MercadoPago" />

            <SettingsLayout>
                <div className="space-y-6">
                    {/* Estado actual */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de integración</CardTitle>
                            <CardDescription>
                                Configuración actual de MercadoPago para este tenant
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Estado</p>
                                    <div className="mt-1">
                                        {config?.configured ? (
                                            <Badge className="bg-green-500 flex items-center gap-1 w-fit">
                                                <CheckCircle className="h-3 w-3" />
                                                Configurado
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">No configurado</Badge>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Ambiente</p>
                                    <p className="font-medium capitalize mt-1">
                                        {config?.ambiente === 'production' ? 'Producción' : 'Sandbox (pruebas)'}
                                    </p>
                                </div>
                                {config?.token_hint && (
                                    <div>
                                        <p className="text-muted-foreground">Access Token</p>
                                        <p className="font-mono text-xs mt-1">{config.token_hint}</p>
                                    </div>
                                )}
                                {config?.public_key && (
                                    <div>
                                        <p className="text-muted-foreground">Public Key</p>
                                        <p className="font-mono text-xs mt-1 truncate">{config.public_key}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Formulario de configuración */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Credenciales</CardTitle>
                            <CardDescription>
                                Ingresá las credenciales de tu cuenta de MercadoPago.{' '}
                                <a
                                    href="https://www.mercadopago.com.ar/developers/es/docs/checkout-api/additional-content/your-integrations/credentials"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary underline"
                                >
                                    Obtener credenciales
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                {/* Ambiente */}
                                <div className="grid gap-2">
                                    <Label>Ambiente</Label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="ambiente"
                                                value="sandbox"
                                                checked={data.ambiente === 'sandbox'}
                                                onChange={() => setData('ambiente', 'sandbox')}
                                                className="accent-primary"
                                            />
                                            <span className="text-sm">Sandbox (pruebas)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="ambiente"
                                                value="production"
                                                checked={data.ambiente === 'production'}
                                                onChange={() => setData('ambiente', 'production')}
                                                className="accent-primary"
                                            />
                                            <span className="text-sm">Producción</span>
                                        </label>
                                    </div>
                                    {data.ambiente === 'production' && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                            En producción se realizarán cobros reales. Asegurate de usar las credenciales de producción de MercadoPago.
                                        </p>
                                    )}
                                </div>

                                {/* Access Token */}
                                <div className="grid gap-2">
                                    <Label htmlFor="access_token">
                                        Access Token{' '}
                                        <span className="text-muted-foreground text-xs">
                                            ({data.ambiente === 'sandbox' ? 'empieza con TEST-' : 'empieza con APP_USR-'})
                                        </span>
                                    </Label>
                                    <Input
                                        id="access_token"
                                        type="password"
                                        value={data.access_token}
                                        onChange={e => setData('access_token', e.target.value)}
                                        placeholder={
                                            config?.configured
                                                ? `Actual: ${config.token_hint} — ingresá uno nuevo para reemplazarlo`
                                                : data.ambiente === 'sandbox'
                                                    ? 'TEST-...'
                                                    : 'APP_USR-...'
                                        }
                                    />
                                    <InputError message={errors.access_token} />
                                </div>

                                {/* Public Key */}
                                <div className="grid gap-2">
                                    <Label htmlFor="public_key">
                                        Public Key{' '}
                                        <span className="text-muted-foreground text-xs">
                                            ({data.ambiente === 'sandbox' ? 'empieza con TEST-' : 'empieza con APP_USR-'})
                                        </span>
                                    </Label>
                                    <Input
                                        id="public_key"
                                        type="text"
                                        value={data.public_key}
                                        onChange={e => setData('public_key', e.target.value)}
                                        placeholder={data.ambiente === 'sandbox' ? 'TEST-...' : 'APP_USR-...'}
                                    />
                                    <InputError message={errors.public_key} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={processing || !data.access_token || !data.public_key}>
                                        Guardar credenciales
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-green-600">Credenciales guardadas correctamente</p>
                                    </Transition>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Instrucciones */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cómo obtener las credenciales</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3 text-muted-foreground">
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Ingresá a <strong className="text-foreground">mercadopago.com.ar</strong> con tu cuenta de empresa</li>
                                <li>Andá a <strong className="text-foreground">Tu negocio → Configuración → Credenciales</strong></li>
                                <li>En <strong className="text-foreground">Credenciales de prueba</strong> (sandbox) o <strong className="text-foreground">Credenciales de producción</strong> copiá el <em>Access Token</em> y la <em>Public Key</em></li>
                                <li>Pegalos en el formulario de arriba y guardá</li>
                            </ol>
                            <p className="pt-1">
                                Las credenciales quedan almacenadas en la base de datos de esta empresa y <strong className="text-foreground">no se comparten</strong> con otros tenants.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
