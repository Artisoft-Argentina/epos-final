import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CodigoDisplay from '@/components/CodigoDisplay';
import { ArrowLeft, Edit, Package } from 'lucide-react';

interface Product {
    id: number; sku: string; name: string; description: string; unit: string;
    price: number; tax_rate: number; min_stock: number; supplier_code?: string;
    category: { name: string };
    brand: { name: string };
    supplier?: { business_name: string };
    stock?: { quantity: number };
    images?: Array<{ id: number; path: string; url: string; url_thumb?: string; is_primary: boolean; }>;
}

interface Props { articulo: Product; }

export default function Show({ articulo }: Props) {
    const primaryImage = articulo.images?.find(img => img.is_primary) || articulo.images?.[0];

    return (
        <AppLayout>
            <Head title={`Artículo: ${articulo.name}`} />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/articulos">
                            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
                        </Link>
                        <h1 className="text-2xl font-bold">{articulo.name}</h1>
                    </div>
                    <Link href={`/articulos/${articulo.id}/edit`}>
                        <Button><Edit className="h-4 w-4 mr-2" />Editar</Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />Información del Producto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">SKU</label>
                                        <p className="font-mono text-lg">{articulo.sku}</p>
                                    </div>
                                    {articulo.supplier_code && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Código Proveedor</label>
                                            <p className="font-mono">{articulo.supplier_code}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Precio</label>
                                        <p className="text-2xl font-bold text-green-600">${articulo.price}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Unidad</label>
                                        <p>{articulo.unit}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Alícuota</label>
                                        <p>{articulo.tax_rate}%</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Stock Mínimo</label>
                                        <p>{articulo.min_stock}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Descripción</label>
                                    <p className="mt-1">{articulo.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="secondary">{articulo.category.name}</Badge>
                                    <Badge variant="outline">{articulo.brand.name}</Badge>
                                    {articulo.supplier && <Badge variant="outline">{articulo.supplier.business_name}</Badge>}
                                </div>
                                {articulo.stock && (
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <label className="text-sm font-medium text-gray-500">Stock Actual</label>
                                        <p className="text-xl font-semibold">{articulo.stock.quantity} {articulo.unit}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {articulo.images && articulo.images.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle>Imágenes</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {articulo.images.map((image) => (
                                            <div key={image.id} className="relative">
                                                <img src={image.url_thumb || image.url} alt={articulo.name} className="w-full h-32 object-cover rounded border" />
                                                {image.is_primary && <Badge className="absolute top-2 left-2" variant="default">Principal</Badge>}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <div>
                        <CodigoDisplay articuloId={articulo.id} articuloNombre={articulo.name} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
