import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingDown, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { Pagination } from '@/components/pagination';

interface Articulo {
    id: number;
    sku: string;
    name: string;
    category?: { name: string };
    brand?: { name: string };
}

interface Inventario {
    id: number;
    quantity: number;
}

interface User {
    id: number;
    name: string;
}

interface Referenciable {
    id: number;
    // campos comunes según el tipo
    [key: string]: any;
}

interface Movimiento {
    id: number;
    type: string;
    quantity: number;
    reason: string | null;
    date: string;
    created_at: string;
    user: User | null;
    referenceable_type: string | null;
    referenceable_id: number | null;
    referenceable: Referenciable | null;
}

interface PaginatedMovimientos {
    data: Movimiento[];
    links: any[];
    current_page: number;
    last_page: number;
}

interface Props {
    articulo: Articulo;
    inventario: Inventario | null;
    movimientos: PaginatedMovimientos;
    stockCalculado: number;
    tipos: Record<string, string>;
}

const TIPOS_ENTRADA = ['purchase_entry', 'assistant_entry', 'adjustment_entry', 'return', 'reconciliation_entry'];
const TIPOS_SALIDA  = ['delivery_exit', 'pos_sale_exit', 'adjustment_exit', 'reconciliation_exit'];

function TipoBadge({ tipo, tipos }: { tipo: string; tipos: Record<string, string> }) {
    const esEntrada = TIPOS_ENTRADA.includes(tipo);
    const esSalida  = TIPOS_SALIDA.includes(tipo);
    const esDevolucion = tipo === 'return';

    let variant: 'default' | 'destructive' | 'secondary' | 'outline' = 'secondary';
    let colorClass = '';

    if (esDevolucion) {
        colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    } else if (esEntrada) {
        colorClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (esSalida) {
        colorClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {esDevolucion ? (
                <RefreshCw className="w-3 h-3" />
            ) : esEntrada ? (
                <TrendingUp className="w-3 h-3" />
            ) : (
                <TrendingDown className="w-3 h-3" />
            )}
            {tipos[tipo] ?? tipo}
        </span>
    );
}

function CantidadCell({ tipo, cantidad }: { tipo: string; cantidad: number }) {
    const esEntrada = TIPOS_ENTRADA.includes(tipo);
    return (
        <span className={`font-semibold tabular-nums ${esEntrada ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {esEntrada ? '+' : '−'}{cantidad}
        </span>
    );
}

function referenciaLabel(movimiento: Movimiento): string {
    if (!movimiento.referenceable_type) return '—';

    const parts = movimiento.referenceable_type.split('\\');
    const model = parts[parts.length - 1];
    return `${model} #${movimiento.referenceable_id}`;
}

export default function Movimientos({ articulo, inventario, movimientos, stockCalculado, tipos }: Props) {
    const stockActual = inventario?.quantity ?? 0;
    const inconsistente = inventario && movimientos.data.length > 0 && stockActual !== stockCalculado;

    return (
        <AppLayout>
            <Head title={`Movimientos — ${articulo.name}`} />

            <div className="p-6 space-y-6">
                {/* Cabecera */}
                <div className="flex items-center gap-4">
                    <Link href={route('articulos.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Artículos
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            Movimientos de stock
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {articulo.sku} — {articulo.name}
                        </p>
                    </div>
                </div>

                {/* Resumen de stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Stock actual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stockActual}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Stock calculado (movimientos)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stockCalculado}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Total movimientos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{movimientos.data.length > 0 ? movimientos.last_page > 1 ? `${movimientos.data.length}+` : movimientos.data.length : 0}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Alerta de inconsistencia */}
                {inconsistente && (
                    <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-4">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Inconsistencia detectada:</strong> el stock actual ({stockActual}) difiere del stock calculado
                            a partir de movimientos ({stockCalculado}). Puede haber modificaciones de stock anteriores a la
                            implementación de trazabilidad.
                        </div>
                    </div>
                )}

                {/* Tabla de movimientos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de movimientos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {movimientos.data.length === 0 ? (
                            <div className="py-12 text-center text-sm text-gray-500">
                                No hay movimientos registrados para este artículo.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Fecha</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Tipo</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Cantidad</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Usuario</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Referencia</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {movimientos.data.map((mov) => (
                                            <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                    {new Date(mov.created_at).toLocaleDateString('es-AR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <TipoBadge tipo={mov.type} tipos={tipos} />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <CantidadCell tipo={mov.type} cantidad={mov.quantity} />
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                    {mov.user?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                                                    {referenciaLabel(mov)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                                                    {mov.reason ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {movimientos.last_page > 1 && (
                    <Pagination links={movimientos.links} />
                )}
            </div>
        </AppLayout>
    );
}
