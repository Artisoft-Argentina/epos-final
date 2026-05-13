import { Head, Link, useForm } from '@inertiajs/react';
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
import { ChevronRight, Save, Package, DollarSign, QrCode, ImagePlus, X, Warehouse, Tag, Layers, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface Category { id: number; name: string; }
interface Brand { id: number; name: string; }
interface Supplier { id: number; business_name: string; }
interface PriceList { id: number; name: string; percentage: string; }
interface Props { categories: Category[]; brands: Brand[]; suppliers: Supplier[]; priceLists: PriceList[]; }

const UNITS = ['Unidad', 'Kg', 'Litro', 'Metro', 'Caja', 'Pack', 'Par', 'Rollo'];
const fmt = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export default function Create({ categories, brands, suppliers, priceLists }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        sku: '',
        ean: '',
        name: '',
        description: '',
        unit: 'Unidad',
        price: '',
        cost: '',
        tax_rate: '21',
        min_stock: '0',
        brand_id: '',
        category_id: '',
        supplier_id: '',
        supplier_code: '',
        active: true,
        published: true,
        track_stock: false,
        initial_stock: '0',
        images: [] as File[],
    });

    const [previews, setPreviews] = useState<string[]>([]);
    const [autoSku, setAutoSku] = useState(true);
    const [trackStock, setTrackStock] = useState(false);
    const [categoryList, setCategoryList] = useState(categories);
    const [brandList, setBrandList] = useState(brands);

    const categoryOptions = categoryList.map((c) => ({ value: c.id.toString(), label: c.name }));
    const brandOptions    = [{ value: '', label: 'Sin marca' }, ...brandList.map((b) => ({ value: b.id.toString(), label: b.name }))];
    const supplierOptions = suppliers.map((s) => ({ value: s.id.toString(), label: s.business_name }));

    const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setData('images', files);
        setPreviews(files.map((f) => URL.createObjectURL(f)));
    };

    const removeImage = (index: number) => {
        setData('images', data.images.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAutoSku = (checked: boolean) => {
        setAutoSku(checked);
        if (checked) setData('sku', '');
    };

    const handleTrackStock = (checked: boolean) => {
        setTrackStock(checked);
        setData('track_stock', checked);
        if (!checked) setData('initial_stock', '0');
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('products.store'), { forceFormData: true });
    };

    return (
        <AppLayout>
            <Head title="Nuevo Producto" />
            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                            <Link href={route('products.index')} className="hover:text-primary transition-colors">Productos</Link>
                            <ChevronRight className="size-3.5" />
                            <span className="text-foreground font-medium">Nuevo Producto</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nuevo Producto</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Completá los datos para agregar un producto al catálogo.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={route('products.index')}><Button variant="outline">Cancelar</Button></Link>
                        <Button onClick={submit} disabled={processing}>
                            <Save className="size-4" />{processing ? 'Guardando...' : 'Guardar Producto'}
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
                                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Ej. Tornillo hexagonal 1/4" error={errors.name} />
                                    </FormField>
                                    <FormField label="Descripción" htmlFor="description" error={errors.description}>
                                        <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Descripción del producto..." rows={3} />
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
                                    <FormField label="Precio base" htmlFor="price" error={errors.price} required>
                                        <Input id="price" type="number" step="0.01" min="0" value={data.price} onChange={(e) => setData('price', e.target.value)} placeholder="0.00" error={errors.price} />
                                    </FormField>
                                    <FormField label="Costo de compra" htmlFor="cost" error={errors.cost}>
                                        <Input id="cost" type="number" step="0.01" min="0" value={data.cost} onChange={(e) => setData('cost', e.target.value)} placeholder="0.00" error={errors.cost} />
                                    </FormField>
                                    <FormField label="Alícuota IVA (%)" htmlFor="tax_rate" error={errors.tax_rate} required>
                                        <Input id="tax_rate" type="number" step="0.01" min="0" value={data.tax_rate} onChange={(e) => setData('tax_rate', e.target.value)} placeholder="21" error={errors.tax_rate} />
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
                                                const base  = parseFloat(data.price) || 0;
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
                                            <p className="text-xs text-muted-foreground mt-2 px-2">Los precios se calcularán automáticamente al guardar.</p>
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
                                <CardContent className="px-6 py-5 flex flex-col gap-5">
                                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Registrar stock inicial</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Ingresá el stock disponible al crear el producto</p>
                                        </div>
                                        <Switch checked={trackStock} onCheckedChange={handleTrackStock} />
                                    </div>
                                    <FormField label="Stock mínimo" htmlFor="min_stock" error={errors.min_stock} required>
                                        <Input id="min_stock" type="number" min="0" value={data.min_stock} onChange={(e) => setData('min_stock', e.target.value)} placeholder="0" error={errors.min_stock} />
                                    </FormField>
                                    {trackStock && (
                                        <FormField label="Cantidad inicial" htmlFor="initial_stock" error={errors.initial_stock} required hint={`En ${data.unit}`}>
                                            <Input id="initial_stock" type="number" min="0" value={data.initial_stock} onChange={(e) => setData('initial_stock', e.target.value)} placeholder="0" error={errors.initial_stock} autoFocus />
                                        </FormField>
                                    )}
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
                                    <label htmlFor="images" className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-5 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                                        <ImagePlus className="size-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Subir imágenes</p>
                                            <p className="text-xs text-muted-foreground">JPEG, PNG, GIF, WebP — Máx. 5 MB</p>
                                        </div>
                                        <input id="images" type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" onChange={handleImages} />
                                    </label>
                                    {previews.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            {previews.map((src, i) => (
                                                <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-border">
                                                    <img src={src} alt="" className="size-full object-cover" />
                                                    {i === 0 && <span className="absolute top-1 left-1 text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Principal</span>}
                                                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X className="size-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                            <Combobox options={brandOptions} value={data.brand_id} onValueChange={(v) => setData('brand_id', v)} placeholder="Sin marca" searchPlaceholder="Buscar marca..." emptyMessage="No se encontró." error={errors.brand_id} />
                                            <QuickCreateDialog title="Nueva Marca" placeholder="Ej. Samsung" routeName="brands.store" onSuccess={(item) => { setBrandList((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name))); setData('brand_id', item.id.toString()); }} />
                                        </div>
                                    </FormField>
                                    <FormField label="Proveedor" error={errors.supplier_id}>
                                        <Combobox options={supplierOptions} value={data.supplier_id} onValueChange={(v) => setData('supplier_id', v)} placeholder="Seleccionar..." searchPlaceholder="Buscar proveedor..." emptyMessage="No se encontró." error={errors.supplier_id} />
                                    </FormField>
                                    <FormField label="Código de proveedor" htmlFor="supplier_code" error={errors.supplier_code}>
                                        <Input id="supplier_code" value={data.supplier_code} onChange={(e) => setData('supplier_code', e.target.value)} placeholder="Ej. PROV-123" error={errors.supplier_code} />
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
                                    <FormField label="SKU" htmlFor="sku" error={errors.sku} hint={autoSku ? 'Se generará automáticamente al guardar.' : 'Código interno único del producto.'}>
                                        <div className="flex items-center gap-2">
                                            <Switch id="auto-sku" checked={autoSku} onCheckedChange={handleAutoSku} />
                                            <label htmlFor="auto-sku" className="text-xs text-muted-foreground cursor-pointer select-none shrink-0">Auto</label>
                                            <Input
                                                id="sku"
                                                value={data.sku}
                                                onChange={(e) => setData('sku', e.target.value)}
                                                placeholder={autoSku ? 'ART-000001' : 'Ej. ART-001'}
                                                error={errors.sku}
                                                disabled={autoSku}
                                                className={autoSku ? 'bg-muted text-muted-foreground' : ''}
                                            />
                                        </div>
                                    </FormField>
                                    <FormField label="EAN / GTIN" htmlFor="ean" error={errors.ean} hint="Código comercial estándar del fabricante.">
                                        <Input id="ean" value={data.ean} onChange={(e) => setData('ean', e.target.value)} placeholder="Ej. 7791234567890" error={errors.ean} />
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
                        <Link href={route('products.index')}><Button variant="outline">Cancelar</Button></Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="size-4" />{processing ? 'Guardando...' : 'Guardar Producto'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
