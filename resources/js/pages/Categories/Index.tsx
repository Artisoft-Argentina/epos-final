import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActionButton } from '@/components/action-button';
import { Pagination } from '@/components/pagination';
import { FormField } from '@/components/form-field';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Search } from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: number;
    name: string;
    active: boolean;
}

interface Props {
    categories: {
        data: Category[];
        links: any[];
        meta: { total: number };
    };
    filters: {
        search?: string;
    };
}

export default function Index({ categories, filters }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        active: true as boolean,
    });

    const openCreate = () => {
        reset();
        setData({ name: '', active: true });
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (category: Category) => {
        setData({ name: category.name, active: category.active });
        setEditing(category);
        setModalOpen(true);
    };

    const handleSubmit = () => {
        if (editing) {
            put(route('categories.update', editing.id), {
                onSuccess: () => setModalOpen(false),
            });
        } else {
            post(route('categories.store'), {
                onSuccess: () => setModalOpen(false),
            });
        }
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(route('categories.index'), { search: value }, { preserveState: true, replace: true });
    };

    const columns: Column<Category>[] = [
        {
            key: 'name',
            header: 'Categoría',
            render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
        },
        {
            key: 'active',
            header: 'Estado',
            render: (row) => (
                <Badge variant={row.active ? 'success' : 'outline'}>
                    {row.active ? 'Activa' : 'Inactiva'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
                <div className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <Switch
                                    checked={row.active}
                                    onCheckedChange={() =>
                                        router.patch(route('categories.toggle-active', row.id), {}, { preserveScroll: true })
                                    }
                                />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>{row.active ? 'Desactivar' : 'Activar'}</TooltipContent>
                    </Tooltip>
                    <ActionButton title="Editar" onClick={() => openEdit(row)}>
                        <Edit className="size-3.5" />
                    </ActionButton>
                    <DeleteConfirmationDialog
                        url={route('categories.destroy', row.id)}
                        title="Eliminar categoría"
                        description={`¿Está seguro que desea eliminar la categoría "${row.name}"?`}
                    />
                </div>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Categorías" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Categorías"
                    description="Administrá las categorías de los productos."
                    actions={
                        <Button onClick={openCreate}>
                            <Plus className="size-4" /> Nueva Categoría
                        </Button>
                    }
                />

                <div className="max-w-sm">
                    <Input
                        startIcon={<Search className="size-4" />}
                        placeholder="Buscar categoría..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={categories.data}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No hay categorías registradas."
                />
                <Pagination links={categories.links} />
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-2">
                        <FormField label="Nombre" htmlFor="name" error={errors.name} required>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                placeholder="Ej: Electrónica"
                                autoFocus
                            />
                        </FormField>

                        <FormField label="Activa" htmlFor="active">
                            <Switch
                                id="active"
                                checked={data.active}
                                onCheckedChange={(v) => setData('active', v)}
                            />
                        </FormField>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={processing}>
                            {editing ? 'Guardar' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
