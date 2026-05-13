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
interface Warehouse { id: number; name: string; is_default: boolean; }
interface Props { articulos: Product[]; warehouses: Warehouse[]; }

export default function Create({ articulos, warehouses }: Props) {
    const page = usePage<any>();
    const defaultWarehouse = warehouses.find((w) => w.is_default) ?? warehouses[0];
    const { data, setData, post, processing, errors } = useForm({
        quantity: '',
        product_id: '',
        warehouse_id: defaultWarehouse ? String(defaultWarehouse.id) : '',
    });

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
                            <FormField label="Almacén" error={errors.warehouse_id} required>
                                <Select value={data.warehouse_id} onValueChange={(v) => setData('warehouse_id', v)}>
                                    <SelectTrigger error={errors.warehouse_id}><SelectValue placeholder="Seleccionar almacén" /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((w) => (
                                            <SelectItem key={w.id} value={String(w.id)}>{w.name}{w.is_default ? ' (default)' : ''}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
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
