import { Head, Link, router, useForm } from '@inertiajs/react';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { Pagination } from '@/components/pagination';
import { ActionButton } from '@/components/action-button';
import { FormField } from '@/components/form-field';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, RefreshCw, Pencil, Search } from 'lucide-react';
import { useState } from 'react';

interface PriceList {
    id: number;
    name: string;
    percentage: number;
    pricing_strategy: 'list' | 'product';
    default_pos: boolean;
    default_ecommerce: boolean;
}

interface PriceListProduct {
    id: number;
    sku: string;
    name: string;
    category: string | null;
    brand: string | null;
    cost: number;
    price: number;
    is_manual: boolean;
    margin_percent: number;
}

interface Props {
    priceList: PriceList;
    products: {
        data: PriceListProduct[];
        links: any[];
        meta?: { total: number };
    };
    filters: {
        search?: string;
    };
}

const fmt = (n: number) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export default function Show({ priceList, products, filters }: Props) {
    const { can } = usePermission();
    const [search, setSearch] = useState(filters.search ?? '');
    const [recalcOpen, setRecalcOpen] = useState(false);
    const [overrideOpen, setOverrideOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<PriceListProduct | null>(null);

    const overrideForm = useForm({ product_id: '', price: '' });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('price-lists.show', priceList.id), { search }, { preserveState: true });
    };

    const handleRecalculate = (strategy: 'all' | 'auto_only') => {
        router.post(route('price-lists.recalculate', priceList.id), { strategy }, {
            onSuccess: () => setRecalcOpen(false),
        });
    };

    const openOverride = (product: PriceListProduct) => {
        setSelectedProduct(product);
        overrideForm.setData({ product_id: product.id.toString(), price: product.price.toString() });
        setOverrideOpen(true);
    };

    const handleOverride = (e: React.FormEvent) => {
        e.preventDefault();
        overrideForm.post(route('price-lists.override-price', priceList.id), {
            onSuccess: () => setOverrideOpen(false),
        });
    };

    const columns: Column<PriceListProduct>[] = [
        {
            key: 'sku',
            header: 'SKU',
            render: (row) => <span className="font-medium text-foreground">{row.sku}</span>,
        },
        {
            key: 'name',
            header: 'Producto',
            render: (row) => (
                <div>
                    <span className="text-foreground">{row.name}</span>
                    {row.category && <span className="block text-xs text-muted-foreground">{row.category}</span>}
                </div>
            ),
        },
        {
            key: 'cost',
            header: 'Costo',
            align: 'right',
            render: (row) => <span className="tabular-nums text-muted-foreground">{fmt(row.cost)}</span>,
        },
        {
            key: 'price',
            header: 'Precio',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                    <span className="font-semibold tabular-nums text-foreground">{fmt(row.price)}</span>
                    {row.is_manual && <Badge variant="warning">Manual</Badge>}
                </div>
            ),
        },
        {
            key: 'margin_percent',
            header: 'Margen',
            align: 'right',
            render: (row) => <span className="tabular-nums text-muted-foreground">{row.margin_percent}%</span>,
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row) => (
                can('price-lists.override-price') && (
                    <ActionButton title="Editar precio" onClick={() => openOverride(row)}>
                        <Pencil className="size-3.5" />
                    </ActionButton>
                )
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title={`Lista: ${priceList.name}`} />
            <div className="flex flex-col gap-6 p-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Link href={route('price-lists.index')} className="hover:text-primary transition-colors">
                        Listas de Precios
                    </Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground font-medium">{priceList.name}</span>
                </div>

                <PageHeader
                    title={priceList.name}
                    description={`Estrategia: ${priceList.pricing_strategy === 'list' ? 'Por lista' : 'Por producto'} — Porcentaje base: ${priceList.percentage}%`}
                    actions={
                        can('price-lists.recalculate') && (
                            <Button variant="outline" onClick={() => setRecalcOpen(true)}>
                                <RefreshCw className="size-4" /> Recalcular
                            </Button>
                        )
                    }
                />

                {/* Búsqueda */}
                <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar producto..."
                        startIcon={<Search className="size-4" />}
                    />
                    <Button type="submit" variant="outline" size="sm">Buscar</Button>
                </form>

                <DataTable columns={columns} data={products.data} keyExtractor={(row) => row.id} emptyMessage="No hay productos en esta lista." />
                <Pagination links={products.links} />
            </div>

            {/* Modal Recalcular */}
            <Dialog open={recalcOpen} onOpenChange={setRecalcOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Recalcular Precios</DialogTitle>
                        <DialogDescription>
                            Elegí qué productos recalcular en la lista "{priceList.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                        <Button onClick={() => handleRecalculate('auto_only')}>
                            Solo automáticos (respeta manuales)
                        </Button>
                        <Button variant="destructive-soft" onClick={() => handleRecalculate('all')}>
                            Recalcular todos (sobreescribe manuales)
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRecalcOpen(false)}>Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Override Precio */}
            <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Precio</DialogTitle>
                        <DialogDescription>
                            {selectedProduct && `Producto: ${selectedProduct.name} (${selectedProduct.sku})`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleOverride} className="flex flex-col gap-4">
                        <FormField label="Nuevo precio" htmlFor="override-price" error={overrideForm.errors.price} required>
                            <Input
                                id="override-price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={overrideForm.data.price}
                                onChange={(e) => overrideForm.setData('price', e.target.value)}
                                error={overrideForm.errors.price}
                            />
                        </FormField>
                        <p className="text-xs text-muted-foreground">Este precio se marcará como "manual" y no se sobreescribirá en recalculados automáticos.</p>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setOverrideOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={overrideForm.processing}>Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
