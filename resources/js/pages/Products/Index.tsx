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
import { Plus, Search, Printer, Eye, Edit, Power, Package, PackageCheck } from 'lucide-react';
import { useState, useRef } from 'react';

interface Category { id: number; name: string; }
interface Brand { id: number; name: string; }
interface Supplier { id: number; business_name: string; }
interface PrimaryImage { url_thumb: string | null; url: string; }

interface Product {
    id: number;
    sku: string;
    name: string;
    price: string;
    active: boolean;
    category: { name: string } | null;
    brand: { name: string } | null;
    primary_image: PrimaryImage | null;
}

interface Props {
    products: { data: Product[]; links: any[]; meta: any };
    filters: { search?: string; active?: string; category_id?: string; brand_id?: string; supplier_id?: string };
    categories: Category[];
    brands: Brand[];
    suppliers: Supplier[];
    kpis: { total: number; active: number };
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

    const handlePrintLabels = () =>
        router.post(route('products.print-labels'), { articulos: selectedIds });

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
            align: 'right',
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
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
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
        { label: 'Total Productos', value: kpis.total,  icon: Package,      sub: 'en el catálogo' },
        { label: 'Activos',         value: kpis.active, icon: PackageCheck, sub: 'disponibles para operar' },
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
                <div className="grid grid-cols-2 gap-4">
                    {kpiCards.map((kpi) => (
                        <Card key={kpi.label} className="gap-0 py-0">
                            <CardContent className="px-4 py-4 flex flex-col gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-full bg-primary/5 flex items-center justify-center">
                                        <kpi.icon className="size-4 text-primary" />
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
                        <SelectTrigger className="w-full sm:w-36">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            <SelectItem value="product">Producto</SelectItem>
                            <SelectItem value="service">Servicio</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.category_id ?? 'all'}
                        onValueChange={(v) => applyFilter({ category_id: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-full sm:w-44">
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
                        <SelectTrigger className="w-full sm:w-40">
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
