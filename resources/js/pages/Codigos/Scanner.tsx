import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QRScanner from '@/components/QRScanner';
import { Camera, Search, Package, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface Articulo {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  category?: { id: number; name: string } | null;
  brand?: { id: number; name: string } | null;
  stock?: { quantity: number } | null;
  barcode?: string;
  qr_code?: string;
}

export default function Scanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [foundArticle, setFoundArticle] = useState<Articulo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const searchByCode = async (code: string) => {
    if (!code.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/scanner/buscar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ codigo: code }),
      });

      const data = await response.json();

      if (response.ok) {
        setFoundArticle(data.articulo);
        toast.success('Artículo encontrado');
      } else {
        toast.error(data.error || 'Artículo no encontrado');
        setFoundArticle(null);
      }
    } catch (error) {
      toast.error('Error al buscar el artículo');
      setFoundArticle(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = (result: string) => {
    setIsScanning(false);
    searchByCode(result);
  };

  const handleManualSearch = () => {
    searchByCode(manualCode);
  };

  const addToCart = () => {
    if (foundArticle) {
      // Aquí puedes implementar la lógica para agregar al carrito
      // Por ejemplo, redirigir a la página de ventas con el artículo
      router.visit('/ventas/create', {
        data: { articulo_id: foundArticle.id }
      });
    }
  };

  return (
    <AppLayout>
      <Head title="Escáner de Códigos" />

      <div className="py-12">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Escáner de Códigos
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Escáner */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Escanear con Cámara
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => setIsScanning(true)}
                      className="w-full"
                      disabled={isScanning}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {isScanning ? 'Escaneando...' : 'Iniciar Escáner'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Búsqueda manual */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Búsqueda Manual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="manual-code">Código del Producto</Label>
                      <Input
                        id="manual-code"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Ingresa el código..."
                        onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                      />
                    </div>
                    <Button
                      onClick={handleManualSearch}
                      className="w-full"
                      disabled={isLoading || !manualCode.trim()}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {isLoading ? 'Buscando...' : 'Buscar'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Resultado */}
              {foundArticle && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Artículo Encontrado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm font-medium">Código</Label>
                          <p className="text-sm text-gray-600">{foundArticle.sku}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Nombre</Label>
                          <p className="text-sm text-gray-600">{foundArticle.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Descripción</Label>
                          <p className="text-sm text-gray-600">{foundArticle.description}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm font-medium">Precio</Label>
                          <p className="text-sm text-gray-600">${foundArticle.price}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Categoría</Label>
                          <p className="text-sm text-gray-600">{foundArticle.category?.name ?? '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Stock</Label>
                          <p className="text-sm text-gray-600">
                            {foundArticle.stock?.quantity ?? 0} unidades
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={addToCart} className="flex-1">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Agregar a Venta
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.visit(`/articulos/${foundArticle.id}`)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <QRScanner
        isActive={isScanning}
        onScan={handleScan}
        onClose={() => setIsScanning(false)}
        onError={(error) => {
          console.error('Scanner error:', error);
          toast.error('Error en el escáner');
        }}
      />
    </AppLayout>
  );
}