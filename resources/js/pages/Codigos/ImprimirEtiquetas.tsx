import React from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer } from 'lucide-react';

interface Etiqueta {
  articulo: {
    id: number;
    sku: string;
    name: string;
    price: number;
    category?: { id: number; name: string } | null;
    brand?: { id: number; name: string } | null;
  };
  codigo_barras: string;
  codigo_qr: string;
  imagen_barras: string;
  imagen_qr: string;
}

interface Props {
  etiquetas: Etiqueta[];
}

export default function ImprimirEtiquetas({ etiquetas }: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Head title="Imprimir Etiquetas" />
      
      <div className="min-h-screen bg-white">
        {/* Botón de imprimir - solo visible en pantalla */}
        <div className="print:hidden p-4 border-b">
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimir Etiquetas
          </Button>
        </div>

        {/* Etiquetas para imprimir */}
        <div className="p-4 grid grid-cols-2 gap-4 print:grid-cols-3 print:gap-2 print:p-2">
          {etiquetas.map((etiqueta) => (
            <Card key={etiqueta.articulo.id} className="border border-gray-300 print:break-inside-avoid">
              <CardContent className="p-3 print:p-2">
                <div className="text-center space-y-2">
                  {/* Nombre del producto */}
                  <h3 className="font-bold text-sm print:text-xs truncate">
                    {etiqueta.articulo.name}
                  </h3>

                  {/* Código del artículo */}
                  <p className="text-xs text-gray-600 print:text-[10px]">
                    Código: {etiqueta.articulo.sku}
                  </p>

                  {/* Código de barras */}
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${etiqueta.imagen_barras}`}
                      alt="Código de barras"
                      className="max-w-full h-8 print:h-6"
                    />
                  </div>
                  
                  {/* Código de barras en texto */}
                  <p className="text-xs font-mono print:text-[8px]">
                    {etiqueta.codigo_barras}
                  </p>

                  {/* Código QR */}
                  <div className="flex justify-center">
                    <img
                      src={`data:image/svg+xml;base64,${etiqueta.imagen_qr}`}
                      alt="Código QR"
                      className="w-16 h-16 print:w-12 print:h-12"
                    />
                  </div>

                  {/* Precio */}
                  <p className="font-bold text-lg print:text-sm">
                    ${etiqueta.articulo.price}
                  </p>

                  {/* Categoría y marca */}
                  <div className="text-xs text-gray-500 print:text-[8px]">
                    <p>{etiqueta.articulo.category?.name ?? '-'}</p>
                    <p>{etiqueta.articulo.brand?.name ?? '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}