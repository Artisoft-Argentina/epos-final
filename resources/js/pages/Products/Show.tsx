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
    ArrowLeftRight, Star,
} from 'lucide-react';

interface ProductImage { id: number; url: string; url_thumb: string | null; is_primary: boolean; }
interface StockMovement {
    id: number;
    type: string;
    quantity: number;
    notes: string | null;
    created_at: string;
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
}

interface Props { product: Product; }

const fmt = (n: string | number) =>
    `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-foreground">{value}</span>
        </div>
    );
}

export default function Show({ product }: Props) {
    const handleToggleActive = () =>
        router.patch(route('products.toggle-active', product.id));

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
                const isIn = ['entrada', 'compra', 'ajuste_positivo'].includes(row.type);
                return (
                    <Badge variant={isIn ? 'success' : 'destructive'}>
                        {isIn ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {row.type}
                    </Badge>
                );
            },
        },
        {
            key: 'quantity',
            header: 'Cantidad',
            align: 'right',
            render: (row) => (
                <span className="font-medium tabular-nums text-foreground">
                    {row.quantity} {product.unit}
                </span>
            ),
        },
        {
            key: 'notes',
            header: 'Notas',
            render: (row) => <span className="text-sm text-muted-foreground">{row.notes ?? '—'}</span>,
        },
    ];

    const kpiCards = [
        { label: 'Precio',        value: fmt(product.price),                                          icon: DollarSign,    iconBg: 'bg-primary/10',      iconColor: 'text-primary' },
        { label: 'Costo',         value: product.cost ? fmt(product.cost) : '—',                      icon: Tag,           iconBg: 'bg-info-soft',       iconColor: 'text-info' },
        { label: 'Stock actual',  value: product.stock ? `${product.stock.quantity} ${product.unit}` : '—', icon: Warehouse, iconBg: 'bg-success-soft', iconColor: 'text-success' },
        { label: 'Stock mínimo',  value: `${product.min_stock} ${product.unit}`,                       icon: ArrowLeftRight, iconBg: 'bg-warning-soft',  iconColor: 'text-warning' },
    ];

    return (
        <AppLayout>
            <Head title={product.name} />
            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Link href={route('products.index')} className="hover:text-primary transition-colors">Productos</Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground font-medium">{product.name}</span>
                </div>

                <PageHeader
                    title={product.name}
                    description={`SKU: ${product.sku}${product.ean ? ` · EAN: ${product.ean}` : ''}`}
                    actions={
                        <div className="flex items-center gap-2">
                            <Badge variant={product.active ? 'success' : 'secondary'} dot>
                                {product.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <Button variant={product.active ? 'destructive-soft' : 'outline'} size="sm" onClick={handleToggleActive}>
                                <Power className="size-4" />
                                {product.active ? 'Desactivar' : 'Activar'}
                            </Button>
                            <Link href={route('products.edit', product.id)}>
                                <Button size="sm"><Edit className="size-4" /> Editar</Button>
                            </Link>
                        </div>
                    }
                />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map((kpi) => (
                        <Card key={kpi.label} className="gap-0 py-0">
                            <CardContent className="px-4 py-4 flex flex-col gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className={`size-8 rounded-full ${kpi.iconBg} flex items-center justify-center`}>
                                        <kpi.icon className={`size-4 ${kpi.iconColor}`} />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
                                </div>
                                <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">{kpi.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs defaultValue="general" variant="underline">
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="identification">Identificación</TabsTrigger>
                        <TabsTrigger value="images">
                            Imágenes {product.images.length > 0 && `(${product.images.length})`}
                        </TabsTrigger>
                        <TabsTrigger value="movements">Movimientos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <DollarSign className="size-4 text-primary" />
                                        Datos Comerciales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-4">
                                    <InfoRow label="Precio" value={fmt(product.price)} />
                                    <InfoRow label="Costo" value={product.cost ? fmt(product.cost) : '—'} />
                                    <InfoRow label="Alícuota IVA" value={`${product.tax_rate}%`} />
                                    <InfoRow label="Unidad" value={product.unit} />
                                    {product.supplier && <InfoRow label="Proveedor" value={product.supplier.business_name} />}
                                    {product.supplier_code && <InfoRow label="Cód. proveedor" value={product.supplier_code} />}
                                </CardContent>
                            </Card>

                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Tag className="size-4 text-primary" />
                                        Clasificación
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-4">
                                    <InfoRow label="Categoría" value={product.category?.name ?? '—'} />
                                    <InfoRow label="Marca" value={product.brand?.name ?? '—'} />
                                    <InfoRow label="Stock mínimo" value={`${product.min_stock} ${product.unit}`} />
                                    <InfoRow label="Catálogo" value={product.published ? 'Publicado' : 'No publicado'} />
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
                                    <div className="w-full flex flex-col gap-3">
                                        <InfoRow label="SKU" value={product.sku} />
                                        <InfoRow label="EAN / GTIN" value={product.ean ?? '—'} />
                                        <InfoRow label="Código para barras" value={product.barcode_value} />
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

                    <TabsContent value="images">
                        {product.images.length === 0 ? (
                            <Card className="gap-0 py-0">
                                <CardContent className="px-6 py-12 flex flex-col items-center gap-3 text-center">
                                    <Package className="size-10 text-muted-foreground/40" />
                                    <p className="text-sm text-muted-foreground">Este producto no tiene imágenes.</p>
                                    <Link href={route('products.edit', product.id)}>
                                        <Button variant="outline" size="sm">Agregar imágenes</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {product.images.map((img) => (
                                    <div key={img.id} className={`relative aspect-square rounded-xl overflow-hidden border-2 ${img.is_primary ? 'border-primary' : 'border-border'}`}>
                                        <img src={img.url_thumb ?? img.url} alt={product.name} className="size-full object-cover" />
                                        {img.is_primary && (
                                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                                <Star className="size-2.5" /> Principal
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="movements">
                        <DataTable
                            columns={movementColumns}
                            data={[]}
                            keyExtractor={(row) => row.id}
                            title="Movimientos de Stock"
                            emptyMessage="No hay movimientos registrados para este producto."
                            footer={<p className="text-sm text-muted-foreground">0 registros</p>}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
