import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Inventario {
    id: number;
    quantity: number;
    product_id: number;
}

interface Product {
    id: number;
    name: string;
    sku: string;
}

interface Props {
    inventario: Inventario;
    articulos: Product[];
}

export default function Edit({ inventario, articulos }: Props) {
    const page = usePage<any>();
    const { data, setData, put, processing, errors } = useForm({
        quantity: inventario.quantity.toString(),
        product_id: inventario.product_id.toString(),
    });

    useEffect(() => {
        if (page.props.flash?.success) toast.success(page.props.flash.success);
        if (page.props.flash?.error) toast.error(page.props.flash.error);
    }, [page.props.flash]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('inventarios.update', inventario.id));
    };

    return (
        <AppLayout>
            <Head title="Editar Inventario" />
            <Card className="max-w-lg m-6">
                <CardHeader>
                    <CardTitle>Editar Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="product_id">Artículo *</Label>
                            <Select value={data.product_id} onValueChange={(value) => setData('product_id', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar artículo" />
                                </SelectTrigger>
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
                            <Input
                                id="quantity"
                                type="number"
                                min="0"
                                value={data.quantity}
                                onChange={(e) => setData('quantity', e.target.value)}
                                error={errors.quantity}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Actualizando...' : 'Actualizar'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
