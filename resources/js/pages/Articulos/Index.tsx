import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Search, Printer, Eye, BarChart2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Pagination } from '@/components/pagination';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface Product {
    id: number;
    sku: string;
    name: string;
    price: number;
    category: { name: string };
    brand: { name: string };
    supplier?: { business_name: string };
}

interface Props {
    articulos: {
        data: Product[];
        links: any[];
        current_page: number;
        last_page: number;
    };
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

    const toggleSelection = (id: number) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const imprimirEtiquetas = () => {
        if (selectedIds.length === 0) { toast.error('Selecciona al menos un artículo'); return; }
        router.post('/codigos/imprimir-etiquetas', { articulos: selectedIds });
    };

    return (
        <AppLayout>
            <Head title="Artículos" />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Artículos</h1>
                    <div className="flex gap-2">
                        {selectedIds.length > 0 && (
                            <Button onClick={imprimirEtiquetas} variant="outline">
                                <Printer className="w-4 h-4 mr-2" />
                                Imprimir Etiquetas ({selectedIds.length})
                            </Button>
                        )}
                        <Link href={route('articulos.create')}>
                            <Button><Plus className="w-4 h-4 mr-2" />Nuevo Artículo</Button>
                        </Link>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Buscar por código, nombre o descripción..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => setSelectedIds(e.target.checked ? articulos.data.map(a => a.id) : [])}
                                        checked={selectedIds.length === articulos.data.length && articulos.data.length > 0}
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Marca</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {articulos.data.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelection(product.id)} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-mono text-gray-900 dark:text-gray-100">{product.sku}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">${product.price}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                            {product.category?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">{product.brand?.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link href={route('articulos.show', product.id)}>
                                                <Button variant="outline" size="sm" title="Ver Detalles"><Eye className="w-4 h-4" /></Button>
                                            </Link>
                                            <Link href={route('movimientos.index', product.id)}>
                                                <Button variant="outline" size="sm" title="Ver movimientos de stock"><BarChart2 className="w-4 h-4" /></Button>
                                            </Link>
                                            <Link href={route('articulos.edit', product.id)}>
                                                <Button variant="outline" size="sm" title="Editar"><Edit className="w-4 h-4" /></Button>
                                            </Link>
                                            <DeleteConfirmationDialog
                                                url={route('articulos.destroy', product.id)}
                                                title="Eliminar artículo"
                                                description={`¿Está seguro que desea eliminar el artículo ${product.name}? Esta acción no se puede deshacer.`}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {articulos.data.map((product) => (
                        <Card key={product.id}>
                            <CardHeader><CardTitle className="text-lg">{product.name}</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2 mb-4">
                                    <p className="text-sm font-mono text-gray-600">SKU: {product.sku}</p>
                                    <p className="text-sm font-semibold text-gray-900">Precio: ${product.price}</p>
                                    <div className="flex gap-2">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{product.category?.name}</span>
                                        <span className="text-sm text-gray-500">{product.brand?.name}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={route('articulos.show', product.id)}><Button variant="outline" size="sm"><Eye className="w-4 h-4" /></Button></Link>
                                    <Link href={route('movimientos.index', product.id)}><Button variant="outline" size="sm"><BarChart2 className="w-4 h-4" /></Button></Link>
                                    <Link href={route('articulos.edit', product.id)}><Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button></Link>
                                    <DeleteConfirmationDialog
                                        url={route('articulos.destroy', product.id)}
                                        title="Eliminar artículo"
                                        description={`¿Está seguro que desea eliminar el artículo ${product.name}? Esta acción no se puede deshacer.`}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Pagination links={articulos.links} />
            </div>
        </AppLayout>
    );
}
