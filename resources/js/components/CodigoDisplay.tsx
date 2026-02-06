import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, ScanLine, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface CodigoDisplayProps {
  articuloId: number;
  articuloNombre: string;
}

interface CodigoData {
  codigo_barras: string;
  codigo_qr: string;
  imagen_barras: string;
  imagen_qr: string;
}

export default function CodigoDisplay({ articuloId, articuloNombre }: CodigoDisplayProps) {
  const [codigos, setCodigos] = useState<CodigoData | null>(null);
  const [loading, setLoading] = useState(false);

  const generarCodigos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/articulos/${articuloId}/codigos`);
      if (response.ok) {
        const data = await response.json();
        setCodigos(data);
        toast.success('Códigos generados correctamente');
      } else {
        toast.error('Error al generar códigos');
      }
    } catch (error) {
      toast.error('Error al generar códigos');
    } finally {
      setLoading(false);
    }
  };

  const descargarCodigo = (tipo: 'qr' | 'barras') => {
    if (!codigos) return;
    
    const imagen = tipo === 'qr' ? codigos.imagen_qr : codigos.imagen_barras;
    const codigo = tipo === 'qr' ? codigos.codigo_qr : codigos.codigo_barras;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imagen}`;
    link.download = `${articuloNombre}_${tipo}_${codigo}.png`;
    link.click();
  };

  const imprimirEtiqueta = () => {
    if (!codigos) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Etiqueta - ${articuloNombre}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .etiqueta {
                border: 1px solid #000;
                padding: 10px;
                max-width: 300px;
                margin: 0 auto;
              }
              .nombre { font-weight: bold; margin-bottom: 10px; }
              .codigo { font-family: monospace; font-size: 12px; margin: 5px 0; }
              img { max-width: 100%; height: auto; margin: 5px 0; }
              @media print {
                body { margin: 0; padding: 10px; }
                .etiqueta { border: 1px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="etiqueta">
              <div class="nombre">${articuloNombre}</div>
              <img src="data:image/png;base64,${codigos.imagen_barras}" alt="Código de barras" />
              <div class="codigo">${codigos.codigo_barras}</div>
              <img src="data:image/png;base64,${codigos.imagen_qr}" alt="Código QR" style="width: 80px; height: 80px;" />
              <div class="codigo">${codigos.codigo_qr}</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Códigos del Producto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!codigos ? (
          <Button onClick={generarCodigos} disabled={loading} className="w-full">
            {loading ? 'Generando...' : 'Generar Códigos'}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h4 className="font-medium">Código de Barras</h4>
              <img
                src={`data:image/png;base64,${codigos.imagen_barras}`}
                alt="Código de barras"
                className="mx-auto max-w-full h-12"
              />
              <p className="text-sm font-mono text-gray-600">{codigos.codigo_barras}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => descargarCodigo('barras')}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>

            <div className="text-center space-y-2">
              <h4 className="font-medium">Código QR</h4>
              <img
                src={`data:image/png;base64,${codigos.imagen_qr}`}
                alt="Código QR"
                className="mx-auto w-24 h-24"
              />
              <p className="text-sm font-mono text-gray-600">{codigos.codigo_qr}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => descargarCodigo('qr')}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>

            <Button onClick={imprimirEtiqueta} className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Etiqueta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}