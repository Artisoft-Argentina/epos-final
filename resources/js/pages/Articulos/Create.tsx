import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Category { id: number; name: string; }
interface Brand { id: number; name: string; }
interface Supplier { id: number; business_name: string; }

interface Props {
    categorias: Category[];
    marcas: Brand[];
    suppliers: Supplier[];
}

export default function Create({ categorias, marcas, suppliers }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        sku: '',
        name: '',
        description: '',
        unit: 'Unidad',
        price: '',
        tax_rate: '',
        min_stock: '',
        brand_id: '',
        category_id: '',
        supplier_id: '',
        supplier_code: '',
        imagenes: [] as File[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('articulos.store'), { forceFormData: true });
    };

    return (
        <AppLayout>
            <Head title="Crear Artículo" />
            <Card className="max-w-2xl">
                <CardHeader><CardTitle>Crear Nuevo Artículo</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="sku">SKU *</Label>
                                <Input id="sku" value={data.sku} onChange={(e) => setData('sku', e.target.value)} error={errors.sku} />
                            </div>
                            <div>
                                <Label htmlFor="supplier_code">Código Proveedor</Label>
                                <Input id="supplier_code" value={data.supplier_code} onChange={(e) => setData('supplier_code', e.target.value)} />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="name">Nombre *</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="description">Descripción *</Label>
                                <Input id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} error={errors.description} />
                            </div>
                            <div>
                                <Label htmlFor="unit">Unidad *</Label>
                                <Select value={data.unit} onValueChange={(value) => setData('unit', value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Unidad">Unidad</SelectItem>
                                        <SelectItem value="Kg">Kg</SelectItem>
                                        <SelectItem value="Litro">Litro</SelectItem>
                                        <SelectItem value="Metro">Metro</SelectItem>
                                        <SelectItem value="Caja">Caja</SelectItem>
                                        <SelectItem value="Pack">Pack</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.unit && <p className="text-sm text-red-600 mt-1">{errors.unit}</p>}
                            </div>
                            <div>
                                <Label htmlFor="price">Precio *</Label>
                                <Input id="price" type="number" step="0.01" value={data.price} onChange={(e) => setData('price', e.target.value)} error={errors.price} />
                            </div>
                            <div>
                                <Label htmlFor="tax_rate">Alícuota *</Label>
                                <Input id="tax_rate" type="number" step="0.01" value={data.tax_rate} onChange={(e) => setData('tax_rate', e.target.value)} error={errors.tax_rate} />
                            </div>
                            <div>
                                <Label htmlFor="min_stock">Stock Mínimo *</Label>
                                <Input id="min_stock" type="number" value={data.min_stock} onChange={(e) => setData('min_stock', e.target.value)} error={errors.min_stock} />
                            </div>
                            <div>
                                <Label htmlFor="category_id">Categoría *</Label>
                                <Select value={data.category_id} onValueChange={(value) => setData('category_id', value)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                                    <SelectContent>
                                        {categorias.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && <p className="text-sm text-red-600 mt-1">{errors.category_id}</p>}
                            </div>
                            <div>
                                <Label htmlFor="brand_id">Marca *</Label>
                                <Select value={data.brand_id} onValueChange={(value) => setData('brand_id', value)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar marca" /></SelectTrigger>
                                    <SelectContent>
                                        {marcas.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.brand_id && <p className="text-sm text-red-600 mt-1">{errors.brand_id}</p>}
                            </div>
                            <div>
                                <Label htmlFor="supplier_id">Proveedor</Label>
                                <Select value={data.supplier_id} onValueChange={(value) => setData('supplier_id', value)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.business_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="imagenes">Imágenes</Label>
                            <Input id="imagenes" type="file" multiple accept="image/*" onChange={(e) => setData('imagenes', Array.from(e.target.files || []))} />
                            <p className="text-sm text-gray-500 mt-1">Múltiples imágenes (JPEG, PNG, JPG, GIF - Máx 5MB cada una).</p>
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
