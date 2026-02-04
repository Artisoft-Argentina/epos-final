import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface Articulo {
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

interface Pago {
  fecha: string;
  monto: number;
  metodo: string;
}

interface Entrega {
  fecha: string;
  estado: string;
  direccion: string;
}

interface Factura {
  id: number;
  numero: number;
  fecha: string;
  total: number;
  pagada: string;
  total_pagado: number;
  saldo_pendiente: number;
  articulos: Articulo[];
  pagos: Pago[];
  entregas: Entrega[];
}

interface Resumen {
  total_compras: number;
  total_pagado: number;
  saldo_pendiente: number;
  entregas_pendientes: number;
  total_facturas: number;
}

interface Cliente {
  nombre: string;
  email: string;
}

export default function UserDashboard({
  facturas,
  resumen,
  cliente,
  mensaje,
}: {
  facturas: Factura[];
  resumen: Resumen;
  cliente?: Cliente;
  mensaje?: string;
}) {
  console.log('Facturas:', facturas);
  console.log('Primera factura articulos:', facturas[0]?.articulos);
  return (
    <AppLayout>
      <Head title="Mi Cuenta" />

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Cuenta</h1>
          {cliente ? (
            <p className="text-muted-foreground">{cliente.nombre} - {cliente.email}</p>
          ) : (
            <p className="text-muted-foreground">Resumen de tus compras</p>
          )}
        </div>

        {mensaje && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{mensaje}</p>
            </CardContent>
          </Card>
        )}

        {/* Resumen */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(resumen.total_compras)}</div>
              <p className="text-xs text-muted-foreground">{resumen.total_facturas} facturas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(resumen.total_pagado)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(resumen.saldo_pendiente)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Entregas Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumen.entregas_pendientes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Facturas */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Mis Facturas</h2>
          
          {facturas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tienes facturas registradas
              </CardContent>
            </Card>
          ) : (
            facturas.map((factura) => (
              <Card key={factura.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Factura #{factura.numero}</CardTitle>
                      <p className="text-sm text-muted-foreground">{factura.fecha}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{formatCurrency(factura.total)}</div>
                      <Badge variant={factura.saldo_pendiente > 0 ? 'destructive' : 'default'}>
                        {factura.saldo_pendiente > 0 ? 'Pendiente' : 'Pagada'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Artículos */}
                  <div>
                    <h4 className="mb-2 font-semibold">Productos</h4>
                    <div className="space-y-1">
                      {factura.articulos.map((art, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{art.nombre} x{art.cantidad}</span>
                          <span>{formatCurrency(art.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pagos */}
                  {factura.pagos.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">Pagos</h4>
                      <div className="space-y-1">
                        {factura.pagos.map((pago, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{pago.fecha} - {pago.metodo}</span>
                            <span className="text-green-600">{formatCurrency(pago.monto)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t pt-1 font-semibold">
                          <span>Saldo Pendiente</span>
                          <span className="text-orange-600">{formatCurrency(factura.saldo_pendiente)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Entregas */}
                  {factura.entregas.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">Entregas</h4>
                      <div className="space-y-1">
                        {factura.entregas.map((entrega, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="flex justify-between">
                              <span>{entrega.fecha}</span>
                              <Badge variant={entrega.estado === 'entregada' ? 'default' : 'secondary'}>
                                {entrega.estado}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{entrega.direccion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
