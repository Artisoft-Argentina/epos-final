import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface Articulo {
    id: number;
    codarticulo: string;
    articulo: string;
    categoria: string | null;
    marca: string | null;
    precio_base: number;
    precio_calculado: number;
    precio_actual: number | null;
}

interface ListaPrecio {
    id: number;
    nombre: string;
    porcentaje: number;
}

interface Props {
    lista: ListaPrecio;
    articulos: Articulo[];
}

export default function Show({ lista, articulos }: Props) {
    const handleRegenerar = () => {
        if (confirm('¿Estás seguro de regenerar todos los precios?')) {
            router.post(`/listas-precios/${lista.id}/regenerar`, {}, {
                onSuccess: () => {
                    router.reload();
                }
            });
        }
    };

    const handleGuardar = () => {
        if (confirm('¿Guardar los precios calculados para todos los productos?')) {
            router.post(`/listas-precios/${lista.id}/regenerar`, {}, {
                onSuccess: () => {
                    router.reload();
                }
            });
        }
    };

    return (
        <AppLayout>
            <Head title={`Lista de Precios - ${lista.nombre}`} />
            
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit('/listas-precios')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">{lista.nombre}</h1>
                            <p className="text-muted-foreground">
                                Porcentaje: {lista.porcentaje}%
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleRegenerar}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerar
                        </Button>
                        <Button onClick={handleGuardar}>
                            Guardar Precios
                        </Button>
                    </div>
                </div>

                <Card className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Código</th>
                                    <th className="text-left p-2">Artículo</th>
                                    <th className="text-left p-2">Categoría</th>
                                    <th className="text-left p-2">Marca</th>
                                    <th className="text-right p-2">Precio Base</th>
                                    <th className="text-right p-2">Precio Calculado</th>
                                    <th className="text-right p-2">Precio Actual</th>
                                    <th className="text-right p-2">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {articulos.map((articulo) => {
                                    const esNuevo = !articulo.precio_actual;
                                    const cambio = articulo.precio_actual 
                                        ? articulo.precio_calculado - articulo.precio_actual
                                        : 0;
                                    
                                    return (
                                        <tr key={articulo.id} className="border-b hover:bg-muted/50">
                                            <td className="p-2">{articulo.codarticulo}</td>
                                            <td className="p-2">{articulo.articulo}</td>
                                            <td className="p-2">{articulo.categoria || '-'}</td>
                                            <td className="p-2">{articulo.marca || '-'}</td>
                                            <td className="p-2 text-right">${articulo.precio_base.toFixed(2)}</td>
                                            <td className="p-2 text-right font-semibold">
                                                ${articulo.precio_calculado.toFixed(2)}
                                            </td>
                                            <td className="p-2 text-right">
                                                {articulo.precio_actual 
                                                    ? `$${articulo.precio_actual.toFixed(2)}`
                                                    : '-'
                                                }
                                            </td>
                                            <td className="p-2 text-right">
                                                {esNuevo ? (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                        Nuevo
                                                    </span>
                                                ) : cambio !== 0 ? (
                                                    <span className={`text-xs px-2 py-1 rounded ${
                                                        cambio > 0 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        {cambio > 0 ? '+' : ''}{cambio.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                                        Sin cambios
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="mt-4 text-sm text-muted-foreground">
                        Total de productos: {articulos.length}
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
