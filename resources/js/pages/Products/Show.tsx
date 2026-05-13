import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable, type Column } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import {
    ChevronRight, Edit, Power, Package, DollarSign, Tag,
    Barcode, QrCode, Printer, Warehouse, TrendingUp, TrendingDown,
    ArrowLeftRight, AlertTriangle, PackageX,
} from 'lucide-react';

interface ProductImage { id: number; url: string; url_thumb: string | null; is_primary: boolean; }
interface StockMovement {
    id: number;
    type: string;
    quantity: number;
    reason: string | null;
    date: string;
    created_at: string;
    user: { id: number; name: string } | null;
    referenceable_type: string | null;
    referenceable_id: number | null;
}

interface PriceListItem {
    id: number;
    name: string;
    percentage: string;
    default_pos: boolean;
    default_ecommerce: boolean;
    pivot: { price: string };
}

interface Product {
    id: number;
    sku: string;
    ean: string | null;
    name: string;
    description: string | null;
    unit: string;
    price: string;
    cost: string | null;
    tax_rate: string;
    min_stock: number;
    supplier_code: string | null;
    active: boolean;
    published: boolean;
    barcode_value: string;
    category: { name: string } | null;
    brand: { name: string } | null;
    supplier: { business_name: string } | null;
    stock: { quantity: number } | null;
    images: ProductImage[];
    price_lists: PriceListItem[];
}

interface Props {
    product: Product;
    movements: StockMovement[];
}

const MOVEMENT_LABELS: Record<string, string> = {
    purchase_entry: 'Ingreso por compra',
    assistant_entry: 'Ingreso por asistente',
    adjustment_entry: 'Ajuste positivo',
    delivery_exit: 'Egreso por entrega',
    pos_sale_exit: 'Venta POS',
    adjustment_exit: 'Ajuste negativo',
    return: 'Devolución',
    reconciliation_entry: 'Conciliación (+)',
    reconciliation_exit: 'Conciliación (-)',
    transfer_out: 'Transferencia salida',
    transfer_in: 'Transferencia entrada',
};

const ENTRY_TYPES = ['purchase_entry', 'assistant_entry', 'adjustment_entry', 'return', 'reconciliation_entry', 'transfer_in'];

const fmt = (n: string | number) =>
    `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-foreground">{value}</span>
        </div>
    );
}

export default function Show({ product, movements }: Props) {
    const qty = product.stock?.quantity ?? null;
    const min = product.min_stock;
    const stockAlert = qty === null ? null
        : qty === 0  ? 'none'
        : qty <= min ? 'low'
        : null;

    const PLURALS: Record<string, string> = { Unidad: 'Unidades', Litro: 'Litros', Metro: 'Metros', Caja: 'Cajas', Rollo: 'Rollos' };
    const unitLabel = (n: number) => n === 1 ? product.unit : (PLURALS[product.unit] ?? product.unit);

    const handleToggleActive = () =>
        router.patch(route('products.toggle-active', product.id));

    const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0] ?? null;
    const otherImages  = product.images.filter((i) => i.id !== primaryImage?.id);

    const movementColumns: Column<StockMovement>[] = [
        {
            key: 'created_at',
            header: 'Fecha',
            render: (row) => (
                <span className="text-sm tabular-nums text-foreground">
                    {new Date(row.created_at).toLocaleDateString('es-AR')}
                </span>
            ),
        },
        {
            key: 'type',
            header: 'Tipo',
            render: (row) => {
                const isIn = ENTRY_TYPES.includes(row.type);
                return (
                    <Badge variant={isIn ? 'success' : 'destructive'}>
                        {isIn ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {MOVEMENT_LABELS[row.type] ?? row.type}
                    </Badge>
                );
            },
        },
        {
            key: 'quantity',
            header: 'Cantidad',
            render: (row) => {
                const isIn = ENTRY_TYPES.includes(row.type);
                return (
                    <span className={`font-medium tabular-nums ${isIn ? 'text-success' : 'text-destructive'}`}>
                        {isIn ? '+' : '-'}{row.quantity} {product.unit}
                    </span>
                );
            },
        },
        {
            key: 'user',
            header: 'Usuario',
            render: (row) => <span className="text-sm text-muted-foreground">{row.user?.name ?? '—'}</span>,
        },
        {
            key: 'reason',
            header: 'Motivo',
            render: (row) => <span className="text-sm text-muted-foreground">{row.reason ?? '—'}</span>,
        },
    ];

    const stockVariant = stockAlert === 'none' ? 'destructive' : stockAlert === 'low' ? 'warning' : 'success';
    const stockValue   = qty !== null ? `${qty} ${unitLabel(qty)}` : '—';

    return (
        <AppLayout>
            <Head title={product.name} />
            <div className="flex flex-col gap-6 p-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Link href={route('products.index')} className="hover:text-primary transition-colors">Productos</Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground font-medium">{product.name}</span>
                </div>

                {/* Hero */}
                <Card className="gap-0 py-0">
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2">

                            {/* Columna imagen */}
                            <div className="flex flex-col gap-3 p-6 border-b lg:border-b-0 lg:border-r border-border">
                                {/* Imagen principal */}
                                <div className="aspect-square max-h-72 w-full rounded-xl overflow-hidden bg-muted flex items-center justify-center border border-border">
                                    {primaryImage ? (
                                        <img
                                            src={primaryImage.url}
                                            alt={product.name}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <Package className="size-12 opacity-30" />
                                            <span className="text-sm">Sin imágenes</span>
                                        </div>
                                    )}
                                </div>

                                {/* Miniaturas */}
                                {otherImages.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {otherImages.map((img) => (
                                            <div
                                                key={img.id}
                                                className="size-16 shrink-0 rounded-lg overflow-hidden border border-border bg-muted"
                                            >
                                                <img
                                                    src={img.url_thumb ?? img.url}
                                                    alt={product.name}
                                                    className="size-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Columna datos */}
                            <div className="flex flex-col gap-5 p-6">

                                {/* Nombre y badges */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant={product.active ? 'success' : 'secondary'} dot>
                                            {product.active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                        {product.published && (
                                            <Badge variant="info">Publicado</Badge>
                                        )}
                                    </div>
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{product.name}</h1>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
                                        <span>{product.sku}</span>
                                        {product.ean && <><span>·</span><span>{product.ean}</span></>}
                                    </div>
                                </div>

                                {/* Precio y stock */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg bg-muted/40 border border-border px-4 py-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                <DollarSign className="size-3.5 text-primary" />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Precio base</p>
                                        </div>
                                        <p className="text-lg font-bold tabular-nums text-foreground">{fmt(product.price)}</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/40 border border-border px-4 py-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="size-6 rounded-full bg-info-soft flex items-center justify-center">
                                                <Tag className="size-3.5 text-info" />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Costo de compra</p>
                                        </div>
                                        <p className="text-lg font-bold tabular-nums text-foreground">{product.cost ? fmt(product.cost) : '—'}</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/40 border border-border px-4 py-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`size-6 rounded-full flex items-center justify-center ${stockAlert === 'none' ? 'bg-destructive-soft' : stockAlert === 'low' ? 'bg-warning-soft' : 'bg-success-soft'}`}>
                                                <Warehouse className={`size-3.5 ${stockAlert === 'none' ? 'text-destructive' : stockAlert === 'low' ? 'text-warning' : 'text-success'}`} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Stock actual</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg font-bold tabular-nums text-foreground">{stockValue}</p>
                                            {stockAlert && (
                                                <Badge variant={stockVariant} className="gap-1">
                                                    {stockAlert === 'none'
                                                        ? <PackageX className="size-3" />
                                                        : <AlertTriangle className="size-3" />
                                                    }
                                                    {stockAlert === 'none' ? 'Sin stock' : 'Bajo'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-muted/40 border border-border px-4 py-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="size-6 rounded-full bg-warning-soft flex items-center justify-center">
                                                <ArrowLeftRight className="size-3.5 text-warning" />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Stock mínimo</p>
                                        </div>
                                        <p className="text-lg font-bold tabular-nums text-foreground">{min} {unitLabel(min)}</p>
                                    </div>
                                </div>

                                {/* Clasificación */}
                                <div className="rounded-lg border border-border overflow-hidden">
                                    {product.category && <DataRow label="Categoría" value={product.category.name} />}
                                    {product.brand    && <DataRow label="Marca"     value={product.brand.name} />}
                                    {product.supplier && <DataRow label="Proveedor" value={product.supplier.business_name} />}
                                    <DataRow label="Alícuota IVA" value={`${product.tax_rate}%`} />
                                    <DataRow label="Unidad" value={product.unit} />
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        variant={product.active ? 'destructive-soft' : 'outline'}
                                        size="sm"
                                        onClick={handleToggleActive}
                                    >
                                        <Power className="size-4" />
                                        {product.active ? 'Desactivar' : 'Activar'}
                                    </Button>
                                    <Link href={route('products.edit', product.id)}>
                                        <Button size="sm">
                                            <Edit className="size-4" /> Editar
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Alertas de stock */}
                {stockAlert === 'none' && (
                    <Alert variant="destructive">
                        <PackageX className="size-4" />
                        <AlertTitle>Sin stock disponible</AlertTitle>
                        <AlertDescription>
                            Este producto no tiene unidades disponibles. Registrá un ingreso de stock para poder operarlo.
                        </AlertDescription>
                    </Alert>
                )}
                {stockAlert === 'low' && (
                    <Alert variant="warning">
                        <AlertTriangle className="size-4" />
                        <AlertTitle>Stock bajo</AlertTitle>
                        <AlertDescription>
                            El stock actual ({qty} {unitLabel(qty ?? 0)}) es igual o inferior al mínimo configurado ({min} {unitLabel(min)}). Considerá reponer mercadería.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Tabs */}
                <Tabs defaultValue="general" variant="underline">
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="prices">Listas de Precios</TabsTrigger>
                        <TabsTrigger value="identification">Identificación</TabsTrigger>
                        <TabsTrigger value="movements">Movimientos</TabsTrigger>
                    </TabsList>

                    {/* Tab: General */}
                    <TabsContent value="general">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <DollarSign className="size-4 text-primary" />
                                        Datos Comerciales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-4">
                                    <DataRow label="Precio base" value={fmt(product.price)} />
                                    <DataRow label="Costo de compra" value={product.cost ? fmt(product.cost) : '—'} />
                                    <DataRow label="Alícuota IVA" value={`${product.tax_rate}%`} />
                                    <DataRow label="Unidad" value={product.unit} />
                                    {product.supplier_code && <DataRow label="Cód. proveedor" value={product.supplier_code} />}
                                </CardContent>
                            </Card>

                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Package className="size-4 text-primary" />
                                        Descripción
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5">
                                    {product.description
                                        ? <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
                                        : <p className="text-sm text-muted-foreground">Sin descripción.</p>
                                    }
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab: Listas de Precios */}
                    <TabsContent value="prices">
                        <Card className="gap-0 py-0">
                            <CardHeader className="border-b border-border px-6 py-4">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <DollarSign className="size-4 text-primary" />
                                    Precios por Lista
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {product.price_lists.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {product.price_lists.map((list) => (
                                            <div key={list.id} className="flex items-center justify-between px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-foreground">{list.name}</span>
                                                    {list.default_pos && <Badge variant="info">POS</Badge>}
                                                    {list.default_ecommerce && <Badge variant="pending">E-commerce</Badge>}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs text-muted-foreground">+{list.percentage}%</span>
                                                    <span className="text-sm font-semibold tabular-nums text-foreground">{fmt(list.pivot.price)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="px-6 py-5 text-sm text-muted-foreground">Este producto no está asignado a ninguna lista de precios.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab: Identificación */}
                    <TabsContent value="identification">
                        <div className="max-w-sm mx-auto">
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <QrCode className="size-4 text-primary" />
                                        Códigos del Producto
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-6 flex flex-col items-center gap-6">
                                    <div className="w-full flex flex-col gap-0">
                                        <DataRow label="SKU" value={product.sku} />
                                        <DataRow label="EAN / GTIN" value={product.ean ?? '—'} />
                                        <DataRow label="Código para barras" value={product.barcode_value} />
                                    </div>
                                    <div className="flex flex-col items-center gap-2 w-full">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                            <Barcode className="size-3.5" /> Código de Barras
                                        </p>
                                        <img src={route('products.barcode', product.id)} alt="Código de barras" className="h-16 w-full object-contain" />
                                        <p className="text-xs font-mono text-muted-foreground">{product.barcode_value}</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                            <QrCode className="size-3.5" /> Código QR
                                        </p>
                                        <img src={route('products.qr', product.id)} alt="Código QR" className="size-32" />
                                    </div>
                                    <a href={route('products.codes', product.id)} target="_blank" rel="noreferrer" className="w-full">
                                        <Button variant="outline" className="w-full">
                                            <Printer className="size-4" /> Imprimir Etiqueta
                                        </Button>
                                    </a>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab: Movimientos */}
                    <TabsContent value="movements">
                        <DataTable
                            columns={movementColumns}
                            data={movements}
                            keyExtractor={(row) => row.id}
                            title="Movimientos de Stock"
                            emptyMessage="No hay movimientos registrados para este producto."
                            footer={
                                movements.length > 0
                                    ? <p className="text-sm text-muted-foreground">{movements.length} registros</p>
                                    : undefined
                            }
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
