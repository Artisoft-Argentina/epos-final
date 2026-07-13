import { Head, Link, useForm, router } from '@inertiajs/react';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActionButton } from '@/components/action-button';
import { FormField } from '@/components/form-field';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/pagination';
import { Plus, Edit, Eye } from 'lucide-react';
import { useState } from 'react';

interface PriceList {
    id: number;
    name: string;
    percentage: number;
    pricing_strategy: 'list' | 'product';
    default_pos: boolean;
    default_ecommerce: boolean;
    active: boolean;
}

interface Props {
    priceLists: {
        data: PriceList[];
        links: any[];
    };
}

export default function Index({ priceLists }: Props) {
    const { can } = usePermission();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<PriceList | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        percentage: '',
        pricing_strategy: 'list' as 'list' | 'product',
        default_pos: false,
        default_ecommerce: false,
    });

    const openCreate = () => {
        setEditing(null);
        reset();
        setDialogOpen(true);
    };

    const openEdit = (priceList: PriceList) => {
        setEditing(priceList);
        setData({
            name: priceList.name,
            percentage: priceList.percentage.toString(),
            pricing_strategy: priceList.pricing_strategy,
            default_pos: priceList.default_pos,
            default_ecommerce: priceList.default_ecommerce,
        });
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            put(route('price-lists.update', editing.id), {
                onSuccess: () => setDialogOpen(false),
            });
        } else {
            post(route('price-lists.store'), {
                onSuccess: () => setDialogOpen(false),
            });
        }
    };

    const columns: Column<PriceList>[] = [
        {
            key: 'name',
            header: 'Nombre',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{row.name}</span>
                    {row.default_pos && <Badge variant="info">POS</Badge>}
                    {row.default_ecommerce && <Badge variant="success">E-commerce</Badge>}
                </div>
            ),
        },
        {
            key: 'percentage',
            header: 'Porcentaje',
            render: (row) => <span className="font-semibold tabular-nums text-foreground">{row.percentage}%</span>,
        },
        {
            key: 'pricing_strategy',
            header: 'Estrategia',
            render: (row) => (
                <Badge variant={row.pricing_strategy === 'list' ? 'info' : 'warning'}>
                    {row.pricing_strategy === 'list' ? 'Por lista' : 'Por producto'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            render: (row) => (
                <div className="flex items-center gap-1">
                    {can('price-lists.show') && (
                        <Link href={route('price-lists.show', row.id)}>
                            <ActionButton title="Ver precios"><Eye className="size-3.5" /></ActionButton>
                        </Link>
                    )}
                    {can('price-lists.update') && (
                        <ActionButton title="Editar" onClick={() => openEdit(row)}>
                            <Edit className="size-3.5" />
                        </ActionButton>
                    )}
                    {can('price-lists.destroy') && (
                        <DeleteConfirmationDialog
                            url={route('price-lists.destroy', row.id)}
                            title="Eliminar lista de precios"
                            description={`¿Estás seguro de eliminar la lista "${row.name}"?`}
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Listas de Precios" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Listas de Precios"
                    actions={
                        can('price-lists.store') && (
                            <Button onClick={openCreate}>
                                <Plus className="size-4" /> Nueva Lista
                            </Button>
                        )
                    }
                />
                <DataTable columns={columns} data={priceLists.data} keyExtractor={(row) => row.id} emptyMessage="No hay listas de precios creadas." />
                <Pagination links={priceLists.links} />
            </div>

            {/* Modal Crear/Editar */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}</DialogTitle>
                        <DialogDescription>
                            {editing ? 'Modificá los datos de la lista.' : 'Completá los datos para crear la lista.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <FormField label="Nombre" htmlFor="name" error={errors.name} required>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Ej. Minorista" error={errors.name} />
                        </FormField>
                        <FormField label="Porcentaje (%)" htmlFor="percentage" error={errors.percentage} required>
                            <Input id="percentage" type="number" step="0.01" value={data.percentage} onChange={(e) => setData('percentage', e.target.value)} placeholder="Ej. 30" error={errors.percentage} />
                        </FormField>
                        <FormField label="Estrategia de cálculo" error={errors.pricing_strategy} required>
                            <Select value={data.pricing_strategy} onValueChange={(v) => setData('pricing_strategy', v as 'list' | 'product')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="list">Por lista — usa el porcentaje de la lista para todos</SelectItem>
                                    <SelectItem value="product">Por producto — usa el % del producto si existe</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">Default POS</span>
                            <Switch checked={data.default_pos} onCheckedChange={(v) => setData('default_pos', v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">Default E-commerce</span>
                            <Switch checked={data.default_ecommerce} onCheckedChange={(v) => setData('default_ecommerce', v)} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>{editing ? 'Guardar' : 'Crear'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
