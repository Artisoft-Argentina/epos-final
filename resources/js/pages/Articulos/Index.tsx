import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActionButton } from '@/components/action-button';
import { Pagination } from '@/components/pagination';
import { Plus, Edit, Search, Printer, Eye, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface Product {
    id: number;
    sku: string;
    name: string;
    price: number;
    category: { name: string };
    brand: { name: string };
}

interface Props {
    articulos: { data: Product[]; links: any[]; current_page: number; last_page: number };
    filters: { search?: string };
}

export default function Index({ articulos, filters }: Props) {
    const page = usePage<any>();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        if (page.props.flash?.success) toast.success(page.props.flash.success);
    }, [page.props.flash]);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(route('articulos.index'), { search: value }, { preserveState: true, replace: true });
    };

    const toggleAll = (checked: boolean) =>
        setSelectedIds(checked ? articulos.data.map((a) => a.id) : []);

    const toggleOne = (id: number) =>
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const imprimirEtiquetas = () => {
        if (selectedIds.length === 0) { toast.error('Selecciona al menos un artículo'); return; }
        router.post('/codigos/imprimir-etiquetas', { articulos: selectedIds });
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
            key: 'sku',
            header: 'SKU',
            render: (row) => <span className="font-mono text-sm text-muted-foreground">{row.sku}</span>,
        },
        {
            key: 'name',
            header: 'Nombre',
            render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
        },
        {
            key: 'price',
            header: 'Precio',
            align: 'right',
            render: (row) => <span className="font-semibold tabular-nums text-foreground">${row.price}</span>,
        },
        {
            key: 'category',
            header: 'Categoría',
            render: (row) => <Badge variant="secondary">{row.category?.name}</Badge>,
        },
        {
            key: 'brand',
            header: 'Marca',
            render: (row) => <span className="text-muted-foreground">{row.brand?.name}</span>,
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Link href={route('articulos.show', row.id)}>
                        <ActionButton title="Ver"><Eye className="size-3.5" /></ActionButton>
                    </Link>
                    <Link href={route('movimientos.index', row.id)}>
                        <ActionButton title="Movimientos"><BarChart2 className="size-3.5" /></ActionButton>
                    </Link>
                    <Link href={route('articulos.edit', row.id)}>
                        <ActionButton title="Editar"><Edit className="size-3.5" /></ActionButton>
                    </Link>
                    <DeleteConfirmationDialog
                        url={route('articulos.destroy', row.id)}
                        title="Eliminar artículo"
                        description={`¿Está seguro que desea eliminar el artículo ${row.name}?`}
                    />
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Artículos" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Artículos"
                    actions={
                        <>
                            {selectedIds.length > 0 && (
                                <Button variant="outline" onClick={imprimirEtiquetas}>
                                    <Printer className="size-4" />
                                    Imprimir Etiquetas ({selectedIds.length})
                                </Button>
                            )}
                            <Link href={route('articulos.create')}>
                                <Button><Plus className="size-4" /> Nuevo Artículo</Button>
                            </Link>
                        </>
                    }
                />

                <div className="max-w-sm">
                    <Input
                        startIcon={<Search className="size-4" />}
                        placeholder="Buscar por código, nombre o descripción..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={articulos.data}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No se encontraron artículos."
                    toolbar={
                        articulos.data.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Checkbox
                                    checked={selectedIds.length === articulos.data.length && articulos.data.length > 0}
                                    onCheckedChange={(checked) => toggleAll(!!checked)}
                                />
                                <span>Seleccionar todos</span>
                            </div>
                        )
                    }
                />

                <Pagination links={articulos.links} />
            </div>
        </AppLayout>
    );
}
