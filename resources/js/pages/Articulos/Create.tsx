import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { FormField } from '@/components/form-field';

interface Category { id: number; name: string; }
interface Brand { id: number; name: string; }
interface Supplier { id: number; business_name: string; }
interface Props { categorias: Category[]; marcas: Brand[]; suppliers: Supplier[]; }

export default function Create({ categorias, marcas, suppliers }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        sku: '', name: '', description: '', unit: 'Unidad', price: '',
        tax_rate: '', min_stock: '', brand_id: '', category_id: '',
        supplier_id: '', supplier_code: '', imagenes: [] as File[],
    });

    const submit = (e: React.FormEvent) => { e.preventDefault(); post(route('articulos.store'), { forceFormData: true }); };

    return (
        <AppLayout>
            <Head title="Crear Artículo" />
            <div className="p-6">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Crear Nuevo Artículo</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="SKU" htmlFor="sku" error={errors.sku} required>
                                    <Input id="sku" value={data.sku} onChange={(e) => setData('sku', e.target.value)} error={errors.sku} placeholder="Ej: ART-001" />
                                </FormField>
                                <FormField label="Código Proveedor" htmlFor="supplier_code">
                                    <Input id="supplier_code" value={data.supplier_code} onChange={(e) => setData('supplier_code', e.target.value)} placeholder="Ej: PROV-123" />
                                </FormField>
                                <FormField label="Nombre" htmlFor="name" error={errors.name} required className="md:col-span-2">
                                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} placeholder="Ej: Tornillo hexagonal 1/4" />
                                </FormField>
                                <FormField label="Descripción" htmlFor="description" error={errors.description} required className="md:col-span-2">
                                    <Input id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} error={errors.description} placeholder="Descripción del artículo" />
                                </FormField>
                                <FormField label="Unidad" error={errors.unit} required>
                                    <Select value={data.unit} onValueChange={(v) => setData('unit', v)}>
                                        <SelectTrigger error={errors.unit}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['Unidad', 'Kg', 'Litro', 'Metro', 'Caja', 'Pack'].map((u) => (
                                                <SelectItem key={u} value={u}>{u}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                                <FormField label="Precio" htmlFor="price" error={errors.price} required>
                                    <Input id="price" type="number" step="0.01" value={data.price} onChange={(e) => setData('price', e.target.value)} error={errors.price} placeholder="0.00" />
                                </FormField>
                                <FormField label="Alícuota" htmlFor="tax_rate" error={errors.tax_rate} required>
                                    <Input id="tax_rate" type="number" step="0.01" value={data.tax_rate} onChange={(e) => setData('tax_rate', e.target.value)} error={errors.tax_rate} placeholder="21" />
                                </FormField>
                                <FormField label="Stock Mínimo" htmlFor="min_stock" error={errors.min_stock} required>
                                    <Input id="min_stock" type="number" value={data.min_stock} onChange={(e) => setData('min_stock', e.target.value)} error={errors.min_stock} placeholder="0" />
                                </FormField>
                                <FormField label="Categoría" error={errors.category_id} required>
                                    <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                        <SelectTrigger error={errors.category_id}><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                                        <SelectContent>{categorias.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormField>
                                <FormField label="Marca" error={errors.brand_id} required>
                                    <Select value={data.brand_id} onValueChange={(v) => setData('brand_id', v)}>
                                        <SelectTrigger error={errors.brand_id}><SelectValue placeholder="Seleccionar marca" /></SelectTrigger>
                                        <SelectContent>{marcas.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormField>
                                <FormField label="Proveedor">
                                    <Select value={data.supplier_id} onValueChange={(v) => setData('supplier_id', v)}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                                        <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.business_name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormField>
                            </div>
                            <FormField label="Imágenes" hint="Múltiples imágenes (JPEG, PNG, JPG, GIF — Máx 5MB cada una)">
                                <FileUpload
                                    accept="image/*"
                                    multiple
                                    hint="JPEG, PNG, JPG, GIF — Máx 5MB cada una"
                                    onChange={(files) => setData('imagenes', Array.from(files || []))}
                                />
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
