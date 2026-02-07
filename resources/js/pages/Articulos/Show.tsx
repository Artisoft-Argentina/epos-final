import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CodigoDisplay from '@/components/CodigoDisplay';
import { ArrowLeft, Edit, Package } from 'lucide-react';

interface Articulo {
  id: number;
  codarticulo: string;
  articulo: string;
  descripcion: string;
  medida: string;
  precio: number;
  alicuota: number;
  stockminimo: number;
  codprov?: string;
  categoria: { categoria: string };
  marca: { marca: string };
  supplier?: { razonsocial: string };
  inventario?: { stock: number };
  imagenes?: Array<{
    id: number;
    ruta: string;
    url: string;
    url_thumb?: string;
    es_principal: boolean;
  }>;
}

interface Props {
  articulo: Articulo;
}

export default function Show({ articulo }: Props) {
  const imagenPrincipal = articulo.imagenes?.find(img => img.es_principal) || articulo.imagenes?.[0];

  return (
    <AppLayout>
      <Head title={`Artículo: ${articulo.articulo}`} />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/articulos">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{articulo.articulo}</h1>
          </div>
          <Link href={`/articulos/${articulo.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Información Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Información del Producto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Código</label>
                    <p className="font-mono text-lg">{articulo.codarticulo}</p>
                  </div>
                  {articulo.codprov && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Código Proveedor</label>
                      <p className="font-mono">{articulo.codprov}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Precio</label>
                    <p className="text-2xl font-bold text-green-600">${articulo.precio}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Medida</label>
                    <p>{articulo.medida}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Alícuota</label>
                    <p>{articulo.alicuota}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Stock Mínimo</label>
                    <p>{articulo.stockminimo}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción</label>
                  <p className="mt-1">{articulo.descripcion}</p>
                </div>

                <div className="flex gap-2">
                  <Badge variant="secondary">{articulo.categoria.categoria}</Badge>
                  <Badge variant="outline">{articulo.marca.marca}</Badge>
                  {articulo.supplier && (
                    <Badge variant="outline">{articulo.supplier.razonsocial}</Badge>
                  )}
                </div>

                {articulo.inventario && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-500">Stock Actual</label>
                    <p className="text-xl font-semibold">
                      {articulo.inventario.stock} {articulo.medida}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Imágenes */}
            {articulo.imagenes && articulo.imagenes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Imágenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {articulo.imagenes.map((imagen) => (
                      <div key={imagen.id} className="relative">
                        <img
                          src={imagen.url_thumb || imagen.url}
                          alt={articulo.articulo}
                          className="w-full h-32 object-cover rounded border"
                        />
                        {imagen.es_principal && (
                          <Badge className="absolute top-2 left-2" variant="default">
                            Principal
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel lateral con códigos */}
          <div>
            <CodigoDisplay 
              articuloId={articulo.id} 
              articuloNombre={articulo.articulo} 
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}