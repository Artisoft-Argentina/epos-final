import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configuración AFIP',
        href: '/settings/afip',
    },
];

interface HealthCheckResult {
    status: 'ok' | 'warning' | 'error';
    message: string;
    details?: Record<string, any>;
}

interface HealthCheckResponse {
    api_publica: HealthCheckResult;
    wsfe: HealthCheckResult;
    padron: HealthCheckResult;
    certificados: HealthCheckResult;
}

interface Props {
    config?: {
        cuit?: string;
        ambiente?: string;
        punto_venta?: number;
        cert_exists?: boolean;
        key_exists?: boolean;
    };
}

export default function Afip({ config }: Props) {
    const [certFile, setCertFile] = useState<File | null>(null);
    const [keyFile, setKeyFile] = useState<File | null>(null);
    const [healthCheck, setHealthCheck] = useState<HealthCheckResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const runHealthCheck = async () => {
        setLoading(true);
        try {
            const response = await fetch(route('afip.health'));
            const data = await response.json();
            setHealthCheck(data);
        } catch (error) {
            console.error('Error running health check:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runHealthCheck();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ok':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ok':
                return <Badge variant="default" className="bg-green-500">Operativo</Badge>;
            case 'warning':
                return <Badge variant="default" className="bg-yellow-500">Advertencia</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración AFIP" />

            <SettingsLayout>
                <div className="space-y-6">
                    {/* Health Check Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Estado de Servicios AFIP</CardTitle>
                                    <CardDescription>
                                        Verificación del estado de los servicios de AFIP
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={runHealthCheck}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                    <span className="ml-2">Verificar</span>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading && !healthCheck ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : healthCheck ? (
                                <div className="space-y-4">
                                    {/* Certificados */}
                                    <div className="flex items-start justify-between p-4 border rounded-lg">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(healthCheck.certificados.status)}
                                            <div>
                                                <p className="font-medium">Certificados</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {healthCheck.certificados.message}
                                                </p>
                                                {healthCheck.certificados.details && (
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        {healthCheck.certificados.details.subject && (
                                                            <p>CUIT: {healthCheck.certificados.details.subject}</p>
                                                        )}
                                                        {healthCheck.certificados.details.expires && (
                                                            <p>Expira: {healthCheck.certificados.details.expires}</p>
                                                        )}
                                                        {healthCheck.certificados.details.days_left && (
                                                            <p>Días restantes: {healthCheck.certificados.details.days_left}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {getStatusBadge(healthCheck.certificados.status)}
                                    </div>

                                    {/* API Pública */}
                                    <div className="flex items-start justify-between p-4 border rounded-lg">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(healthCheck.api_publica.status)}
                                            <div>
                                                <p className="font-medium">API Pública (Consulta Padrón)</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {healthCheck.api_publica.message}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(healthCheck.api_publica.status)}
                                    </div>

                                    {/* WSFE */}
                                    <div className="flex items-start justify-between p-4 border rounded-lg">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(healthCheck.wsfe.status)}
                                            <div>
                                                <p className="font-medium">Facturación Electrónica (WSFE)</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {healthCheck.wsfe.message}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(healthCheck.wsfe.status)}
                                    </div>

                                    {/* Padrón Autenticado */}
                                    <div className="flex items-start justify-between p-4 border rounded-lg">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(healthCheck.padron.status)}
                                            <div>
                                                <p className="font-medium">Padrón Autenticado (WS)</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {healthCheck.padron.message}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(healthCheck.padron.status)}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Error al verificar el estado de los servicios
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Configuración actual */}
                    {config && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuración Actual</CardTitle>
                                <CardDescription>
                                    Información de la configuración de AFIP
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">CUIT Empresa</p>
                                        <p className="font-medium">{config.cuit || 'No configurado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Ambiente</p>
                                        <p className="font-medium capitalize">{config.ambiente || 'homologacion'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Punto de Venta</p>
                                        <p className="font-medium">{config.punto_venta || 1}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Certificados</p>
                                        <p className="font-medium">
                                            {config.cert_exists && config.key_exists
                                                ? 'Configurados'
                                                : 'No configurados'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Upload de certificados */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Certificados AFIP</CardTitle>
                            <CardDescription>
                                Sube los archivos de certificado y clave privada de AFIP
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                method="post"
                                action={route('afip.upload')}
                                encType="multipart/form-data"
                                options={{
                                    preserveScroll: true,
                                }}
                                onSuccess={() => runHealthCheck()}
                                className="space-y-6"
                            >
                                {({ processing, recentlySuccessful, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="cert_file">Certificado (.pem/.crt)</Label>
                                            <Input
                                                id="cert_file"
                                                type="file"
                                                name="cert_file"
                                                accept=".pem,.crt,.cert"
                                                onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                                                required
                                            />
                                            <InputError className="mt-2" message={errors.cert_file} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="key_file">Clave privada (.pem/.key)</Label>
                                            <Input
                                                id="key_file"
                                                type="file"
                                                name="key_file"
                                                accept=".pem,.key"
                                                onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
                                                required
                                            />
                                            <InputError className="mt-2" message={errors.key_file} />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <Button
                                                disabled={processing || !certFile || !keyFile}
                                                type="submit"
                                            >
                                                Subir certificados
                                            </Button>

                                            <Transition
                                                show={recentlySuccessful}
                                                enter="transition ease-in-out"
                                                enterFrom="opacity-0"
                                                leave="transition ease-in-out"
                                                leaveTo="opacity-0"
                                            >
                                                <p className="text-sm text-green-600">Certificados subidos correctamente</p>
                                            </Transition>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
