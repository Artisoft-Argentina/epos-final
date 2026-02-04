import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { router } from '@inertiajs/react';

interface ListaPrecio {
    id: number;
    nombre: string;
    porcentaje: number;
    default_pos: boolean;
    default_ecommerce: boolean;
}

interface Props {
    listas: ListaPrecio[];
}

export default function Index({ listas }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta lista de precios?')) {
            router.delete(route('listas-precios.destroy', id));
        }
    };

    return (
        <AppSidebarLayout>
            <Head title="Listas de Precios" />
            
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Listas de Precios</h1>
                    <Link href={route('listas-precios.create')}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Lista
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4">
                    {listas.map((lista) => (
                        <Card key={lista.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{lista.nombre}</span>
                                    <div className="flex gap-2">
                                        {lista.default_pos && (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                POS Default
                                            </Badge>
                                        )}
                                        {lista.default_ecommerce && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700">
                                                E-commerce Default
                                            </Badge>
                                        )}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Incremento: <span className="font-semibold">{lista.porcentaje}%</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={route('listas-precios.show', lista.id)}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                Ver Precios
                                            </Button>
                                        </Link>
                                        <Link href={route('listas-precios.edit', lista.id)}>
                                            <Button variant="outline" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleDelete(lista.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {listas.length === 0 && (
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-gray-500">No hay listas de precios creadas</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppSidebarLayout>
    );
}