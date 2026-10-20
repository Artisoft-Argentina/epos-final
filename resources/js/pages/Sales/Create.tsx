import QRScanner from '@/components/QRScanner';
import { PosDesktop } from '@/components/sales/pos-desktop';
import { PosMobile } from '@/components/sales/pos-mobile';
import { useSaleForm, type SaleFormProps } from '@/components/sales/use-sale-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ListOrdered, Plus, X } from 'lucide-react';

/**
 * Pantalla de venta (POS).
 *
 * El catálogo y el comprobante conviven en una pantalla grande y se turnan en
 * una chica, así que el layout se bifurca en dos shells. Lo que no se bifurca
 * es la venta: todo el estado y las reglas viven en `useSaleForm`, una sola
 * copia que los dos consumen.
 */
export default function Create(props: SaleFormProps) {
    const { can } = usePermission();
    const isMobile = useIsMobile();
    const sale = useSaleForm(props);

    // Sin ninguna lista configurada el POS no es operable: todos los artículos
    // saldrían a $0. Se bloquea la venta y se ofrece el camino para resolverlo.
    if (props.priceLists.length === 0) {
        return (
            <AppLayout>
                <Head title="Nueva Venta" />

                <div className="flex flex-1 items-center justify-center p-6">
                    <Card className="w-full max-w-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ListOrdered className="size-4 text-muted-foreground" />
                                Nueva Venta
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <Alert variant="warning">
                                <AlertTriangle className="size-4" />
                                <AlertTitle>No hay listas de precios configuradas</AlertTitle>
                                <AlertDescription>
                                    El precio de cada artículo sale de una lista de precios. Hasta que exista al menos una, no se pueden registrar
                                    ventas.
                                </AlertDescription>
                            </Alert>

                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    <X className="size-4" />
                                    Volver
                                </Button>
                                {can('price-lists.store') ? (
                                    <Link href={route('price-lists.index')}>
                                        <Button>
                                            <Plus className="size-4" />
                                            Crear lista de precios
                                        </Button>
                                    </Link>
                                ) : (
                                    <p className="self-center text-sm text-muted-foreground">
                                        Pedile a un administrador que configure una lista de precios.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Nueva Venta" />

            {isMobile ? <PosMobile sale={sale} /> : <PosDesktop sale={sale} />}

            <QRScanner
                isActive={sale.isScanning}
                onScan={sale.handleScanResult}
                onClose={() => sale.setIsScanning(false)}
                onError={(error) => {
                    console.error('Scanner error:', error);
                    sale.setIsScanning(false);
                }}
            />
        </AppLayout>
    );
}
