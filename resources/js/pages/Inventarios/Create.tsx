import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Product { id: number; name: string; sku: string; }
interface Supplier { id: number; business_name: string; }

interface Props {
    articulos: Product[];
    suppliers: Supplier[];
}

export default function Create({ articulos, suppliers }: Props) {
    const page = usePage<any>();
    const { data, setData, post, processing, errors } = useForm({
        quantity: '',
        batch: '',
        expiration_date: '',
        product_id: '',
        supplier_id: '',
    });

    useEffect(() => {
        if (page.props.flash?.success) toast.success(page.props.flash.success);
        if (page.props.flash?.error) toast.error(page.props.flash.error);
    }, [page.props.flash]);

    const submit = (e: React.FormEvent) => { e.preventDefault(); post(route('inventarios.store')); };

    return (
        <AppLayout>
            <Head title="Crear Inventario" />
            <Card className="max-w-2xl">
                <CardHeader><CardTitle>Crear Nuevo Inventario</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="product_id">Artículo *</Label>
                                <Select value={data.product_id} onValueChange={(value) => setData('product_id', value)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar artículo" /></SelectTrigger>
                                    <SelectContent>
                                        {articulos.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                {p.sku} - {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.product_id && <p className="text-sm text-red-600 mt-1">{errors.product_id}</p>}
                            </div>
                            <div>
                                <Label htmlFor="quantity">Cantidad *</Label>
                                <Input id="quantity" type="number" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} error={errors.quantity} />
                            </div>
                            <div>
                                <Label htmlFor="supplier_id">Proveedor</Label>
                                <Select value={data.supplier_id} onValueChange={(value) => setData('supplier_id', value)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.business_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.supplier_id && <p className="text-sm text-red-600 mt-1">{errors.supplier_id}</p>}
                            </div>
                            <div>
                                <Label htmlFor="batch">Lote</Label>
                                <Input id="batch" type="number" value={data.batch} onChange={(e) => setData('batch', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="expiration_date">Vencimiento</Label>
                                <Input id="expiration_date" type="date" value={data.expiration_date} onChange={(e) => setData('expiration_date', e.target.value)} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>{processing ? 'Creando...' : 'Crear'}</Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
