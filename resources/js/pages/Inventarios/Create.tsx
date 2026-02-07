import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Articulo {
    id: number;
    articulo: string;
    codarticulo: string;
}

interface Supplier {
    id: number;
    razonsocial: string;
}

interface Props {
    articulos: Articulo[];
    suppliers: Supplier[];
}

export default function Create({ articulos, suppliers }: Props) {
    const page = usePage<any>();
    const { data, setData, post, processing, errors } = useForm({
        cantidad: '',
        lote: '',
        vencimiento: '',
        articulo_id: '',
        supplier_id: '',
    });

    useEffect(() => {
        if (page.props.flash?.success) {
            toast.success(page.props.flash.success);
        }
        if (page.props.flash?.error) {
            toast.error(page.props.flash.error);
        }
    }, [page.props.flash]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('inventarios.store'));
    };

    return (
        <AppLayout>
            <Head title="Crear Inventario" />
            
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Crear Nuevo Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="articulo_id">Artículo *</Label>
                                <Select value={data.articulo_id} onValueChange={(value) => setData('articulo_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar artículo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {articulos.map((articulo) => (
                                            <SelectItem key={articulo.id} value={articulo.id.toString()}>
                                                {articulo.codarticulo} - {articulo.articulo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.articulo_id && <p className="text-sm text-red-600 mt-1">{errors.articulo_id}</p>}
                            </div>
                            <div>
                                <Label htmlFor="cantidad">Cantidad *</Label>
                                <Input
                                    id="cantidad"
                                    type="number"
                                    value={data.cantidad}
                                    onChange={(e) => setData('cantidad', e.target.value)}
                                    error={errors.cantidad}
                                />
                            </div>
                            <div>
                                <Label htmlFor="supplier_id">Proveedor</Label>
                                <Select value={data.supplier_id} onValueChange={(value) => setData('supplier_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar proveedor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                {supplier.razonsocial}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.supplier_id && <p className="text-sm text-red-600 mt-1">{errors.supplier_id}</p>}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creando...' : 'Crear'}
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