import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Warehouse {
    id: number;
    name: string;
    is_default: boolean;
}

interface Factura {
    id: number;
    invoice_number: number;
    customer: {
        business_name: string;
        fantasy_name?: string | null;
    };
    products: Array<{
        id: number;
        name: string;
        sku: string;
        pivot: {
            quantity: number;
        };
    }>;
    deliveries: Array<{
        id: number;
        product_id: number;
        quantity: number;
        status: 'pending' | 'delivered' | 'cancelled';
        delivery_date: string;
    }>;
}

interface Props {
    factura: Factura;
    warehouses: Warehouse[];
}

interface EntregaItem {
    articulo_id: string;
    cantidad: number;
    warehouse_id: string;
}

export default function Create({ factura, warehouses }: Props) {
    const defaultWarehouseId = warehouses.find((w) => w.is_default)?.id ?? warehouses[0]?.id ?? null;
    const [entregas, setEntregas] = useState<EntregaItem[]>([
        { articulo_id: '', cantidad: 1, warehouse_id: defaultWarehouseId ? String(defaultWarehouseId) : '' }
    ]);

    const { data, setData, post, processing, errors } = useForm({
        entregas,
        fecha_entrega: new Date().toISOString().split('T')[0],
        observaciones: '',
    });

    const getCantidadEntregada = (productId: number) => {
        return factura.deliveries
            .filter(d => d.product_id === productId && d.status === 'delivered')
            .reduce((sum, d) => sum + d.quantity, 0);
    };

    const getCantidadPendiente = (productId: number) => {
        const product = factura.products.find(p => p.id === productId);
        const cantidadVendida = product?.pivot.quantity || 0;
        const cantidadEntregada = getCantidadEntregada(productId);
        return cantidadVendida - cantidadEntregada;
    };

    const addEntrega = () => {
        const nuevasEntregas = [...entregas, { articulo_id: '', cantidad: 1, warehouse_id: defaultWarehouseId ? String(defaultWarehouseId) : '' }];
        setEntregas(nuevasEntregas);
        setData('entregas', nuevasEntregas);
    };

    const removeEntrega = (index: number) => {
        const nuevasEntregas = entregas.filter((_, i) => i !== index);
        setEntregas(nuevasEntregas);
        setData('entregas', nuevasEntregas);
    };

    const updateEntrega = (index: number, field: keyof EntregaItem, value: any) => {
        const nuevasEntregas = [...entregas];
        nuevasEntregas[index] = { ...nuevasEntregas[index], [field]: value };
        setEntregas(nuevasEntregas);
        setData('entregas', nuevasEntregas);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('entregas.store', factura.id));
    };

    return (
        <AppLayout>
            <Head title="Registrar Entrega" />

            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Registrar Entrega</h1>
                    <p className="text-gray-600">Factura #{factura.invoice_number} - {factura.customer.fantasy_name || factura.customer.business_name}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Artículos de la Venta */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Artículos de la Venta</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {factura.products.map((product) => {
                                    const cantidadPendiente = getCantidadPendiente(product.id);
                                    return (
                                        <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                            <div>
                                                <p className="font-medium">{product.sku} - {product.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    Vendido: {product.pivot.quantity} |
                                                    Entregado: {getCantidadEntregada(product.id)} |
                                                    Pendiente: {cantidadPendiente}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                cantidadPendiente === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {cantidadPendiente === 0 ? 'Completo' : 'Pendiente'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Formulario de Entrega */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Entrega</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="fecha_entrega">Fecha de Entrega *</Label>
                                <Input
                                    id="fecha_entrega"
                                    type="date"
                                    value={data.fecha_entrega}
                                    onChange={(e) => setData('fecha_entrega', e.target.value)}
                                />
                                {errors.fecha_entrega && <p className="text-sm text-red-600 mt-1">{errors.fecha_entrega}</p>}
                            </div>

                            <div>
                                <Label htmlFor="observaciones">Observaciones</Label>
                                <Input
                                    id="observaciones"
                                    value={data.observaciones}
                                    onChange={(e) => setData('observaciones', e.target.value)}
                                    placeholder="Observaciones adicionales..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Artículos a Entregar */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Artículos a Entregar</CardTitle>
                            <Button type="button" onClick={addEntrega} variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar Artículo
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            {entregas.map((entrega, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                                    <div>
                                        <Label>Artículo</Label>
                                        <Select value={entrega.articulo_id} onValueChange={(v) => updateEntrega(index, 'articulo_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar artículo" /></SelectTrigger>
                                            <SelectContent>
                                                {factura.products
                                                    .filter(p => getCantidadPendiente(p.id) > 0)
                                                    .map((product) => (
                                                        <SelectItem key={product.id} value={product.id.toString()}>
                                                            {product.sku} - {product.name} (Pendiente: {getCantidadPendiente(product.id)})
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Almacén</Label>
                                        <Select value={entrega.warehouse_id} onValueChange={(v) => updateEntrega(index, 'warehouse_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Almacén" /></SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((w) => (
                                                    <SelectItem key={w.id} value={String(w.id)}>{w.name}{w.is_default ? ' (default)' : ''}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Cantidad</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max={entrega.articulo_id ? getCantidadPendiente(Number(entrega.articulo_id)) : 1}
                                            value={entrega.cantidad}
                                            onChange={(e) => updateEntrega(index, 'cantidad', parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button type="button" variant="outline" size="sm" onClick={() => removeEntrega(index)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={processing}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {processing ? 'Registrando...' : 'Registrar Entrega'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    <X className="w-4 h-4 mr-2" />
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
