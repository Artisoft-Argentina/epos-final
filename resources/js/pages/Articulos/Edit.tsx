import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';
import CodigoDisplay from '@/components/CodigoDisplay';

interface ProductImage { id: number; path: string; url: string; url_thumb?: string; }
interface Product {
    id: number; sku: string; name: string; description: string; unit: string;
    price: number; tax_rate: number; min_stock: number; brand_id: number;
    category_id: number; supplier_id?: number; supplier_code?: string;
    images?: ProductImage[];
}
interface Category { id: number; name: string; }
interface Brand { id: number; name: string; }
interface Supplier { id: number; business_name: string; }

interface Props {
    articulo: Product;
    categorias: Category[];
    marcas: Brand[];
    suppliers: Supplier[];
}

export default function Edit({ articulo, categorias, marcas, suppliers }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        sku: articulo.sku,
        name: articulo.name,
        description: articulo.description,
        unit: articulo.unit,
        price: articulo.price.toString(),
        tax_rate: articulo.tax_rate.toString(),
        min_stock: articulo.min_stock.toString(),
        brand_id: articulo.brand_id.toString(),
        category_id: articulo.category_id.toString(),
        supplier_id: articulo.supplier_id?.toString() || '',
        supplier_code: articulo.supplier_code || '',
        imagenes: [] as File[],
        _method: 'PUT',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('articulos.update', articulo.id), { forceFormData: true });
    };

    const deleteImage = (imageId: number) => {
        if (confirm('¿Estás seguro de eliminar esta imagen?')) {
            router.delete(route('articulos.imagenes.destroy', imageId));
        }
    };

    return (
        <AppLayout>
            <Head title="Editar Artículo" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader><CardTitle>Editar Artículo</CardTitle></CardHeader>
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
                                    </div>
                                    <div>
                                        <Label htmlFor="brand_id">Marca *</Label>
                                        <Select value={data.brand_id} onValueChange={(value) => setData('brand_id', value)}>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar marca" /></SelectTrigger>
                                            <SelectContent>
                                                {marcas.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
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
                                    <Label htmlFor="description">Descripción *</Label>
                                    <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} required />
                                    <InputError message={errors.description} />
                                </div>
                                {articulo.images && articulo.images.length > 0 && (
                                    <div>
                                        <Label>Imágenes actuales</Label>
                                        <div className="grid grid-cols-4 gap-4 mt-2">
                                            {articulo.images.map((image) => (
                                                <div key={image.id} className="relative">
                                                    <img src={image.url_thumb || image.url} alt={articulo.name} className="w-full h-24 object-cover rounded border" />
                                                    <button type="button" onClick={() => deleteImage(image.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <Label htmlFor="imagenes">Agregar nuevas imágenes</Label>
                                    <Input id="imagenes" type="file" multiple accept="image/*" onChange={(e) => setData('imagenes', Array.from(e.target.files || []))} />
                                    <InputError message={errors.imagenes} />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={processing}>{processing ? 'Actualizando...' : 'Actualizar Artículo'}</Button>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <CodigoDisplay articuloId={articulo.id} articuloNombre={articulo.name} />
                </div>
            </div>
        </AppLayout>
    );
}
