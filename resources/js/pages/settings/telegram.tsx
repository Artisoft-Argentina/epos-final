import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Telegram({ flash }: { flash?: { success?: string; error?: string } }) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('telegram.verify'));
    };

    return (
        <>
            <Head title="Telegram" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Telegram</h1>
                    <p className="text-muted-foreground">Vincula tu cuenta con los bots de Telegram</p>
                </div>

                {flash?.success && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription className="text-green-800 dark:text-green-200">{flash.success}</AlertDescription>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Vincular Cuenta de Telegram</CardTitle>
                        <CardDescription>Conecta tu cuenta de EPOS con los bots de Telegram para recibir notificaciones y usar comandos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                                <h3 className="font-semibold">📱 Pasos para vincular:</h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                    <li>Busca el bot en Telegram según tu rol:</li>
                                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                        <li>
                                            <strong>Administrador:</strong> @epos_admin_bot
                                        </li>
                                        <li>
                                            <strong>Vendedor:</strong> @epos_vendedor_bot
                                        </li>
                                    </ul>
                                    <li>Envía el comando /start al bot</li>
                                    <li>Copia el código de 6 dígitos que te envía</li>
                                    <li>Pega el código aquí abajo y haz clic en "Verificar"</li>
                                </ol>
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Código de Verificación</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="123456"
                                        maxLength={6}
                                        className="text-center text-2xl tracking-widest font-mono"
                                        autoComplete="off"
                                    />
                                    {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                                </div>

                                <Button type="submit" disabled={processing || data.code.length !== 6} className="w-full">
                                    {processing ? 'Verificando...' : 'Verificar Código'}
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
