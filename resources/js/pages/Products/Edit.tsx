import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/form-field';
import { QuickCreateDialog } from '@/components/quick-create-dialog';
import { ImageUploadPreview } from '@/components/image-upload-preview';
import { ChevronRight, Save, Package, DollarSign, QrCode, ImagePlus, X, Star, Tag, Layers, SlidersHorizontal, Warehouse } from 'lucide-react';
import { useState } from 'react';

interface ProductImage { id: number; url: string; url_thumb: string | null; is_primary: boolean; }
interface Category { id: number; name: string; }
interface Brand { id: number; name: string; }
interface Supplier { id: number; business_name: string; }
interface PriceList { id: number; name: string; percentage: string; }

interface Product {
    id: number;
    sku: string;
    ean: string | null;
    name: string;
    description: string | null;
    unit: string;
    cost: string;
    markup_percent: string | null;
    tax_rate: string;
    min_stock: number;
    brand_id: number | null;
    category_id: number;
    supplier_id: number | null;
    supplier_code: string | null;
    active: boolean;
    published: boolean;
    images: ProductImage[];
}

interface Props {
    product: Product;
    categories: Category[];
    brands: Brand[];
    suppliers: Supplier[];
    priceLists: PriceList[];
}

const UNITS = ['Unidad', 'Kg', 'Litro', 'Metro', 'Caja', 'Pack', 'Par', 'Rollo'];
const fmt = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export default function Edit({ product, categories, brands, suppliers, priceLists }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        sku: product.sku,
        ean: product.ean ?? '',
        name: product.name,
        description: product.description ?? '',
        unit: product.unit,
        cost: product.cost,
        markup_percent: product.markup_percent ?? '',
        tax_rate: product.tax_rate,
        min_stock: product.min_stock.toString(),
        brand_id: product.brand_id?.toString() ?? '',
        category_id: product.category_id.toString(),
        supplier_id: product.supplier_id?.toString() ?? '',
        supplier_code: product.supplier_code ?? '',
        active: product.active,
        published: product.published,
        images: [] as File[],
        primary_image_index: 0,
        _method: 'PUT',
    });

    const [categoryList, setCategoryList] = useState(categories);
    const [brandList, setBrandList] = useState(brands);

    const categoryOptions = categoryList.map((c) => ({ value: c.id.toString(), label: c.name }));
    const brandOptions    = [{ value: '', label: 'Sin marca' }, ...brandList.map((b) => ({ value: b.id.toString(), label: b.name }))];
    const supplierOptions = suppliers.map((s) => ({ value: s.id.toString(), label: s.business_name }));

    const handleImages = (files: File[], primaryIndex: number) => {
        setData('images', files);
        setData('primary_image_index', primaryIndex);
    };

    const deleteImage = (imageId: number) =>
        router.delete(route('products.images.destroy', imageId), { preserveScroll: true });

    const setPrimary = (imageId: number) =>
        router.post(route('products.images.set-primary', imageId), {}, { preserveScroll: true });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('products.update', product.id), { forceFormData: true });
    };

    return (
        <AppLayout>
            <Head title={`Editar: ${product.name}`} />
            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                            <Link href={route('products.index')} className="hover:text-primary transition-colors">Productos</Link>
                            <ChevronRight className="size-3.5" />
                            <Link href={route('products.show', product.id)} className="hover:text-primary transition-colors">{product.name}</Link>
                            <ChevronRight className="size-3.5" />
                            <span className="text-foreground font-medium">Editar</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Editar Producto</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{product.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={route('products.show', product.id)}><Button variant="outline">Cancelar</Button></Link>
                        <Button onClick={submit} disabled={processing}>
                            <Save className="size-4" />{processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ── Columna izquierda ── */}
                        <div className="lg:col-span-2 flex flex-col gap-6">

                            {/* Datos Generales */}
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Package className="size-4 text-primary" />Datos Generales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5 flex flex-col gap-5">
                                    <FormField label="Nombre" htmlFor="name" error={errors.name} required>
                                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder={product.name} error={errors.name} />
                                    </FormField>
                                    <FormField label="Descripción" htmlFor="description" error={errors.description}>
                                        <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder={product.description ?? 'Descripción del producto...'} rows={3} />
                                    </FormField>
                                </CardContent>
                            </Card>

                            {/* Datos Comerciales */}
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <DollarSign className="size-4 text-primary" />Datos Comerciales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5 grid grid-cols-2 gap-5">
                                    <FormField label="Costo" htmlFor="cost" error={errors.cost} required>
                                        <Input id="cost" type="number" step="0.01" min="0" value={data.cost} onChange={(e) => setData('cost', e.target.value)} placeholder={product.cost} error={errors.cost} />
                                    </FormField>
                                    <FormField label="% Ganancia" htmlFor="markup_percent" error={errors.markup_percent} hint="Opcional. Se usa como template para listas.">
                                        <Input id="markup_percent" type="number" step="0.01" min="0" value={data.markup_percent} onChange={(e) => setData('markup_percent', e.target.value)} placeholder="Ej. 30" error={errors.markup_percent} />
                                    </FormField>
                                    <FormField label="Alícuota IVA (%)" htmlFor="tax_rate" error={errors.tax_rate} required>
                                        <Input id="tax_rate" type="number" step="0.01" min="0" value={data.tax_rate} onChange={(e) => setData('tax_rate', e.target.value)} placeholder={product.tax_rate} error={errors.tax_rate} />
                                    </FormField>
                                    <FormField label="Unidad" error={errors.unit} required>
                                        <Select value={data.unit} onValueChange={(v) => setData('unit', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </FormField>
                                </CardContent>
                            </Card>

                            {/* Listas de Precios */}
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Tag className="size-4 text-primary" />Listas de Precios
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5">
                                    {priceLists.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
                                            <p className="text-sm text-muted-foreground">No hay listas de precios configuradas. El precio base se usará directamente en ventas.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <div className="grid grid-cols-3 px-2 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                <span>Lista</span>
                                                <span className="text-right">Porcentaje</span>
                                                <span className="text-right">Precio final</span>
                                            </div>
                                            {priceLists.map((list) => {
                                                const base  = parseFloat(data.cost) || 0;
                                                const pct   = parseFloat(list.percentage);
                                                const final = base * (1 + pct / 100);
                                                return (
                                                    <div key={list.id} className="grid grid-cols-3 px-2 py-2.5 rounded-md hover:bg-muted/40 transition-colors">
                                                        <span className="text-sm font-medium text-foreground">{list.name}</span>
                                                        <span className="text-sm tabular-nums text-muted-foreground text-right">{pct >= 0 ? '+' : ''}{pct}%</span>
                                                        <span className="text-sm font-semibold tabular-nums text-foreground text-right">
                                                            {base > 0 ? fmt(final) : <span className="text-muted-foreground">—</span>}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            <p className="text-xs text-muted-foreground mt-2 px-2">Si modificás el precio base, los precios se recalcularán automáticamente al guardar.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Stock */}
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Warehouse className="size-4 text-primary" />Stock
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5">
                                    <FormField label="Stock mínimo" htmlFor="min_stock" error={errors.min_stock} required>
                                        <Input id="min_stock" type="number" min="0" value={data.min_stock} onChange={(e) => setData('min_stock', e.target.value)} placeholder={product.min_stock.toString()} error={errors.min_stock} />
                                    </FormField>
                                </CardContent>
                            </Card>

                            {/* Imágenes */}
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <ImagePlus className="size-4 text-primary" />Imágenes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5 flex flex-col gap-4">
                                    {product.images.length > 0 && (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Imágenes actuales</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {product.images.map((img) => (
                                                    <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden border border-border">
                                                        <img src={img.url_thumb ?? img.url} alt="" className="size-full object-cover" />
                                                        {img.is_primary && <span className="absolute top-1 left-1 text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Principal</span>}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                            {!img.is_primary && (
                                                                <button type="button" onClick={() => setPrimary(img.id)} className="size-7 rounded-md bg-white text-foreground flex items-center justify-center hover:bg-muted transition-colors" title="Hacer principal">
                                                                    <Star className="size-3.5" />
                                                                </button>
                                                            )}
                                                            <button type="button" onClick={() => deleteImage(img.id)} className="size-7 rounded-md bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors" title="Eliminar imagen">
                                                                <X className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <ImageUploadPreview onChange={handleImages} maxFiles={5 - product.images.length} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* ── Columna derecha ── */}
                        <div className="flex flex-col gap-6">

                            {/* Clasificación */}
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Layers className="size-4 text-primary" />Clasificación
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5 flex flex-col gap-5">
                                    <FormField label="Categoría" error={errors.category_id} required>
                                        <div className="flex gap-2">
                                            <Combobox options={categoryOptions} value={data.category_id} onValueChange={(v) => setData('category_id', v)} placeholder="Seleccionar..." searchPlaceholder="Buscar categoría..." emptyMessage="No se encontró." error={errors.category_id} />
                                            <QuickCreateDialog title="Nueva Categoría" placeholder="Ej. Electrónica" routeName="categories.store" onSuccess={(item) => { setCategoryList((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name))); setData('category_id', item.id.toString()); }} />
                                        </div>
                                    </FormField>
                                    <FormField label="Marca" error={errors.brand_id}>
                                        <div className="flex gap-2">
                                            <Combobox options={brandOptions} value={data.brand_id || ''} onValueChange={(v) => setData('brand_id', v)} placeholder="Sin marca" searchPlaceholder="Buscar marca..." emptyMessage="No se encontró." error={errors.brand_id} />
                                            <QuickCreateDialog title="Nueva Marca" placeholder="Ej. Samsung" routeName="brands.store" onSuccess={(item) => { setBrandList((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name))); setData('brand_id', item.id.toString()); }} />
                                        </div>
                                    </FormField>
                                    <FormField label="Proveedor" error={errors.supplier_id}>
                                        <Combobox options={supplierOptions} value={data.supplier_id} onValueChange={(v) => setData('supplier_id', v)} placeholder="Seleccionar..." searchPlaceholder="Buscar proveedor..." emptyMessage="No se encontró." error={errors.supplier_id} />
                                    </FormField>
                                    <FormField label="Código de proveedor" htmlFor="supplier_code" error={errors.supplier_code}>
                                        <Input id="supplier_code" value={data.supplier_code} onChange={(e) => setData('supplier_code', e.target.value)} placeholder={product.supplier_code ?? 'Ej. PROV-123'} error={errors.supplier_code} />
                                    </FormField>
                                </CardContent>
                            </Card>

                            {/* Identificación */}
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <QrCode className="size-4 text-primary" />Identificación
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5 flex flex-col gap-5">
                                    <FormField label="SKU" hint="El SKU no puede modificarse una vez creado el producto.">
                                        <Input value={data.sku} placeholder={product.sku} disabled className="bg-muted text-muted-foreground" />
                                    </FormField>
                                    <FormField label="EAN / GTIN" htmlFor="ean" error={errors.ean} hint="Código comercial estándar del fabricante.">
                                        <Input id="ean" value={data.ean} onChange={(e) => setData('ean', e.target.value)} placeholder={product.ean ?? 'Ej. 7791234567890'} error={errors.ean} />
                                    </FormField>
                                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-center">
                                        <p className="text-xs text-muted-foreground leading-relaxed">El código de barras se genera usando el EAN si existe, o el SKU en caso contrario.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Estado */}
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <SlidersHorizontal className="size-4 text-primary" />Estado
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Activo</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Habilita el producto para operar</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={data.active ? 'success' : 'secondary'} dot>{data.active ? 'Activo' : 'Inactivo'}</Badge>
                                            <Switch checked={data.active} onCheckedChange={(v) => setData('active', v)} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Publicar en catálogo</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Visible en la tienda en línea</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={data.published ? 'info' : 'secondary'} dot>{data.published ? 'Publicado' : 'No publicado'}</Badge>
                                            <Switch checked={data.published} onCheckedChange={(v) => setData('published', v)} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4">
                        <Link href={route('products.show', product.id)}><Button variant="outline">Cancelar</Button></Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="size-4" />{processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
