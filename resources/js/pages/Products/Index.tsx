import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { ActionButton } from '@/components/action-button';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Pagination } from '@/components/pagination';
import { Plus, Search, Printer, Eye, Edit, Power, Package, PackageCheck, AlertTriangle, PackageX } from 'lucide-react';
import { useState, useRef } from 'react';

interface Category { id: number; name: string; }
interface Brand { id: number; name: string; }
interface Supplier { id: number; business_name: string; }
interface PrimaryImage { url_thumb: string | null; url: string; }

interface Product {
    id: number;
    sku: string;
    ean: string | null;
    name: string;
    unit: string;
    price: string;
    min_stock: number;
    active: boolean;
    category: { name: string } | null;
    brand: { name: string } | null;
    primary_image: PrimaryImage | null;
    stock: { quantity: number } | null;
}

interface Props {
    products: { data: Product[]; links: any[]; meta: any };
    filters: { search?: string; active?: string; category_id?: string; brand_id?: string; supplier_id?: string; stock_status?: string };
    categories: Category[];
    brands: Brand[];
    suppliers: Supplier[];
    kpis: { total: number; active: number; low_stock: number; no_stock: number };
}

const fmt = (n: string | number) =>
    `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export default function Index({ products, filters, categories, brands, suppliers, kpis }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const applyFilter = (params: Record<string, string>) =>
        router.get(route('products.index'), { ...filters, ...params }, { preserveState: true, replace: true });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => applyFilter({ search: value }), 300);
    };

    const toggleAll = (checked: boolean) =>
        setSelectedIds(checked ? products.data.map((p) => p.id) : []);

    const toggleOne = (id: number) =>
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const handleToggleActive = (product: Product) =>
        router.patch(route('products.toggle-active', product.id));

    const handlePrintLabels = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = route('products.print-labels');
        form.target = '_blank';

        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_token';
        csrfInput.value = csrf;
        form.appendChild(csrfInput);

        selectedIds.forEach((id) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'articulos[]';
            input.value = id.toString();
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const columns: Column<Product>[] = [
        {
            key: 'select',
            header: '',
            className: 'w-10',
            render: (row) => (
                <Checkbox
                    checked={selectedIds.includes(row.id)}
                    onCheckedChange={() => toggleOne(row.id)}
                />
            ),
        },
        {
            key: 'image',
            header: '',
            className: 'w-12',
            render: (row) => (
                <div className="size-10 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {row.primary_image ? (
                        <img
                            src={row.primary_image.url_thumb ?? row.primary_image.url}
                            alt={row.name}
                            className="size-full object-cover"
                        />
                    ) : (
                        <Package className="size-4 text-muted-foreground" />
                    )}
                </div>
            ),
        },
        {
            key: 'name',
            header: 'Producto',
            render: (row) => (
                <div>
                    <p className="font-medium text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{row.sku}</p>
                    {row.ean && <p className="text-xs text-muted-foreground font-mono">{row.ean}</p>}
                </div>
            ),
        },
        {
            key: 'price',
            header: 'Precio',
            render: (row) => (
                <span className="font-medium tabular-nums text-foreground">{fmt(row.price)}</span>
            ),
        },
        {
            key: 'category',
            header: 'Categoría',
            render: (row) => row.category
                ? <Badge variant="secondary">{row.category.name}</Badge>
                : <span className="text-muted-foreground">—</span>,
        },
        {
            key: 'brand',
            header: 'Marca',
            render: (row) => (
                <span className="text-sm text-muted-foreground">{row.brand?.name ?? '—'}</span>
            ),
        },
        {
            key: 'stock',
            header: 'Stock',
            render: (row) => {
                if (!row.stock) return <span className="text-muted-foreground">Sin stock</span>;
                const qty = row.stock.quantity;
                const min = row.min_stock;
                const variant = qty === 0 ? 'destructive' : qty <= min ? 'warning' : 'success';
                const showAlert = qty > 0 && qty <= min;
                const PLURALS: Record<string, string> = { Unidad: 'Unidades', Litro: 'Litros', Metro: 'Metros', Caja: 'Cajas', Rollo: 'Rollos' };
                const label = qty === 1 ? row.unit : (PLURALS[row.unit] ?? row.unit);
                return (
                    <Badge variant={variant} className="gap-1">
                        {showAlert && <AlertTriangle className="size-3" />}
                        {qty} {label}
                    </Badge>
                );
            },
        },
        {
            key: 'active',
            header: 'Estado',
            render: (row) => (
                <Badge variant={row.active ? 'success' : 'secondary'} dot>
                    {row.active ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
                <div className="flex items-center gap-1">
                    <Link href={route('products.show', row.id)}>
                        <ActionButton title="Ver detalle"><Eye className="size-3.5" /></ActionButton>
                    </Link>
                    <Link href={route('products.edit', row.id)}>
                        <ActionButton title="Editar"><Edit className="size-3.5" /></ActionButton>
                    </Link>
                    <ActionButton
                        title={row.active ? 'Desactivar' : 'Activar'}
                        onClick={() => handleToggleActive(row)}
                        variant={row.active ? 'destructive-soft' : 'outline'}
                    >
                        <Power className="size-3.5" />
                    </ActionButton>
                    <DeleteConfirmationDialog
                        url={route('products.destroy', row.id)}
                        title="Eliminar producto"
                        description={`¿Estás seguro que querés eliminar "${row.name}"? Esta acción no se puede deshacer.`}
                    />
                </div>
            ),
        },
    ];

    const kpiCards = [
        { label: 'Total Productos', value: kpis.total,     icon: Package,      sub: 'en el catálogo',           iconBg: 'bg-primary/5',        iconColor: 'text-primary' },
        { label: 'Activos',         value: kpis.active,    icon: PackageCheck, sub: 'disponibles para operar',  iconBg: 'bg-success-soft',     iconColor: 'text-success' },
        { label: 'Stock bajo',      value: kpis.low_stock, icon: AlertTriangle, sub: 'iguales o por debajo del mínimo', iconBg: 'bg-warning-soft',  iconColor: 'text-warning' },
        { label: 'Sin stock',       value: kpis.no_stock,  icon: PackageX,     sub: 'con 0 unidades disponibles',     iconBg: 'bg-destructive-soft', iconColor: 'text-destructive' },
    ];

    return (
        <AppLayout>
            <Head title="Productos" />
            <div className="flex flex-col gap-6 p-6">

                <PageHeader
                    title="Productos"
                    description="Gestioná el catálogo de productos"
                    actions={
                        <>
                            {selectedIds.length > 0 && (
                                <Button variant="outline" onClick={handlePrintLabels}>
                                    <Printer className="size-4" />
                                    Imprimir etiquetas ({selectedIds.length})
                                </Button>
                            )}
                            <Link href={route('products.create')}>
                                <Button><Plus className="size-4" /> Nuevo Producto</Button>
                            </Link>
                        </>
                    }
                />

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map((kpi) => (
                        <Card key={kpi.label} className="gap-0 py-0">
                            <CardContent className="px-4 py-4 flex flex-col gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className={`size-8 rounded-full ${kpi.iconBg} flex items-center justify-center`}>
                                        <kpi.icon className={`size-4 ${kpi.iconColor}`} />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{kpi.label}</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{kpi.value}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <div className="w-full sm:max-w-sm">
                        <Input
                            startIcon={<Search className="size-4" />}
                            placeholder="Buscar por nombre, SKU o EAN..."
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                    <Select
                        value={filters.active ?? 'all'}
                        onValueChange={(v) => applyFilter({ active: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="1">Activo</SelectItem>
                            <SelectItem value="0">Inactivo</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.stock_status ?? 'all'}
                        onValueChange={(v) => applyFilter({ stock_status: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Stock" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todo el stock</SelectItem>
                            <SelectItem value="low">Stock bajo</SelectItem>
                            <SelectItem value="none">Sin stock</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.category_id ?? 'all'}
                        onValueChange={(v) => applyFilter({ category_id: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las categorías</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.brand_id ?? 'all'}
                        onValueChange={(v) => applyFilter({ brand_id: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="Marca" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las marcas</SelectItem>
                            {brands.map((b) => (
                                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    data={products.data}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No se encontraron productos."
                    toolbar={
                        products.data.length > 0 ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Checkbox
                                    checked={selectedIds.length === products.data.length}
                                    onCheckedChange={(checked) => toggleAll(!!checked)}
                                />
                                <span>Seleccionar todos</span>
                            </div>
                        ) : undefined
                    }
                    footer={
                        <p className="text-sm text-muted-foreground">
                            {products.meta?.total ?? products.data.length} resultados
                        </p>
                    }
                />

                <Pagination links={products.links} />
            </div>
        </AppLayout>
    );
}
