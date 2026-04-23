import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Supplier {
    id: number;
    business_name: string;
}

interface Product {
    id: number;
    sku: string;
    name: string;
    price: number;
}

interface OrderProduct {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    product: Product;
}

interface Order {
    id: number;
    pos_number: number;
    order_number: number;
    date: string;
    supplier_id: number;
    notes: string | null;
    converted_to_inventory: boolean;
    products: OrderProduct[];
}

interface Props {
    order: Order;
    suppliers: Supplier[];
}

interface DetalleForm {
    articulo_id: number | null;
    quantity: number;
    unit_price: number;
}

export default function Edit({ order, suppliers }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        pos_number: order.pos_number,
        order_number: order.order_number.toString(),
        date: order.date,
        supplier_id: order.supplier_id.toString(),
        notes: order.notes || '',
        detalles: [] as DetalleForm[],
    });

    const [detalles, setDetalles] = useState<DetalleForm[]>([]);
    const [articulos, setArticulos] = useState<Product[]>([]);
    const [loadingArticulos, setLoadingArticulos] = useState(false);

    // Cargar artículos del proveedor
    const cargarArticulos = async (supplierId: string) => {
        if (!supplierId) {
            setArticulos([]);
            return;
        }

        setLoadingArticulos(true);
        try {
            const response = await fetch(route('orders.products', supplierId));
            const data = await response.json();
            setArticulos(data);
        } catch (error) {
            console.error('Error cargando artículos:', error);
        } finally {
            setLoadingArticulos(false);
        }
    };

    // Inicializar detalles desde la orden existente
    useEffect(() => {
        const detallesIniciales = order.products.map(p => ({
            articulo_id: p.product_id,
            quantity: p.quantity,
            unit_price: Number(p.unit_price),
        }));
        setDetalles(detallesIniciales);
        setData('detalles', detallesIniciales);
    }, []);

    useEffect(() => {
        if (data.supplier_id) {
            cargarArticulos(data.supplier_id);
        }
    }, [data.supplier_id]);

    const agregarDetalle = () => {
        const nuevos = [...detalles, { articulo_id: null, quantity: 1, unit_price: 0 }];
        setDetalles(nuevos);
        setData('detalles', nuevos);
    };

    const eliminarDetalle = (index: number) => {
        const nuevos = detalles.filter((_, i) => i !== index);
        setDetalles(nuevos);
        setData('detalles', nuevos);
    };

    const actualizarDetalle = (index: number, campo: keyof DetalleForm, valor: any) => {
        const nuevos = [...detalles];
        nuevos[index] = { ...nuevos[index], [campo]: valor };

        if (campo === 'articulo_id') {
            const articulo = articulos.find(a => a.id === valor);
            if (articulo) {
                nuevos[index].unit_price = articulo.price;
            }
        }

        setDetalles(nuevos);
        setData('detalles', nuevos);
    };

    const calcularTotal = () => {
        return detalles.reduce((total, d) => total + (d.quantity * d.unit_price), 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('orders.update', order.id));
    };

    const numeroCompleto = `${order.pos_number.toString().padStart(4, '0')}-${order.order_number.toString().padStart(8, '0')}`;

    return (
        <AppLayout>
            <Head title={`Editar Orden ${numeroCompleto}`} />

            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={route('orders.show', order.id)} className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-sm hover:bg-accent">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <h1 className="text-2xl font-bold">Editar Orden {numeroCompleto}</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información General</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Label htmlFor="pos_number">Punto de Venta</Label>
                                    <Input
                                        id="pos_number"
                                        type="number"
                                        value={data.pos_number}
                                        onChange={(e) => setData('pos_number', parseInt(e.target.value) || 1)}
                                        error={errors.pos_number}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="order_number">Nro. de Orden</Label>
                                    <Input
                                        id="order_number"
                                        type="number"
                                        value={data.order_number}
                                        onChange={(e) => setData('order_number', e.target.value)}
                                        error={errors.order_number}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="date">Fecha</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        error={errors.date}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="supplier_id">Proveedor</Label>
                                    <Select value={data.supplier_id} onValueChange={(value) => {
                                        setData('supplier_id', value);
                                        setDetalles([{ articulo_id: null, quantity: 1, unit_price: 0 }]);
                                        setData('detalles', [{ articulo_id: null, quantity: 1, unit_price: 0 }]);
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar proveedor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((supplier) => (
                                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                    {supplier.business_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.supplier_id && <p className="text-sm text-red-600 mt-1">{errors.supplier_id}</p>}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="notes">Observaciones</Label>
                                <Input
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Observaciones opcionales"
                                    error={errors.notes}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Artículos</CardTitle>
                                <Button type="button" onClick={agregarDetalle} variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Artículo
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {detalles.map((detalle, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                                        <div className="md:col-span-2">
                                            <Label>Artículo</Label>
                                            <Select
                                                value={detalle.articulo_id?.toString() || ''}
                                                onValueChange={(value) => actualizarDetalle(index, 'articulo_id', parseInt(value))}
                                                disabled={!data.supplier_id || loadingArticulos}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={
                                                        !data.supplier_id ? "Seleccione un proveedor primero" :
                                                        loadingArticulos ? "Cargando artículos..." :
                                                        "Seleccionar artículo"
                                                    } />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {articulos.map((articulo) => (
                                                        <SelectItem key={articulo.id} value={articulo.id.toString()}>
                                                            {articulo.sku} - {articulo.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Cantidad</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={detalle.quantity}
                                                onChange={(e) => actualizarDetalle(index, 'quantity', parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Precio Unitario</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={detalle.unit_price}
                                                onChange={(e) => actualizarDetalle(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => eliminarDetalle(index)}
                                                disabled={detalles.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total:</span>
                                    <span className="text-xl font-bold">
                                        ${calcularTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Link href={route('orders.show', order.id)}>
                            <Button variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            Actualizar Orden
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
