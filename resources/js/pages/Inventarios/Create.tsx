import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Product { id: number; name: string; sku: string; }
interface Props { articulos: Product[]; }

export default function Create({ articulos }: Props) {
    const page = usePage<any>();
    const { data, setData, post, processing, errors } = useForm({ quantity: '', product_id: '' });

    useEffect(() => {
        if (page.props.flash?.success) toast.success(page.props.flash.success);
        if (page.props.flash?.error) toast.error(page.props.flash.error);
    }, [page.props.flash]);

    const submit = (e: React.FormEvent) => { e.preventDefault(); post(route('inventarios.store')); };

    return (
        <AppLayout>
            <Head title="Crear Inventario" />
            <div className="p-6">
                <Card className="max-w-lg">
                    <CardHeader><CardTitle>Crear Nuevo Inventario</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <FormField label="Artículo" error={errors.product_id} required>
                                <Select value={data.product_id} onValueChange={(v) => setData('product_id', v)}>
                                    <SelectTrigger error={errors.product_id}><SelectValue placeholder="Seleccionar artículo" /></SelectTrigger>
                                    <SelectContent>
                                        {articulos.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.sku} - {p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField label="Cantidad inicial" htmlFor="quantity" error={errors.quantity} required>
                                <Input id="quantity" type="number" min="0" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} error={errors.quantity} placeholder="0" />
                            </FormField>
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
