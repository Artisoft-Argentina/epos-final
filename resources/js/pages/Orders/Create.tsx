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

interface Articulo {
    id: number;
    sku: string;
    name: string;
    price: number;
}

interface Props {
    suppliers: Supplier[];
}

interface DetalleForm {
    articulo_id: number | null;
    quantity: number;
    unit_price: number;
}

export default function Create({ suppliers }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        pos_number: 1,
        order_number: '',
        date: new Date().toISOString().split('T')[0],
        supplier_id: '',
        detalles: [] as DetalleForm[],
    });

    const [detalles, setDetalles] = useState<DetalleForm[]>([
        { articulo_id: null, quantity: 1, unit_price: 0 }
    ]);
    const [articulos, setArticulos] = useState<Articulo[]>([]);
    const [loadingArticulos, setLoadingArticulos] = useState(false);

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

    useEffect(() => {
        if (data.supplier_id) {
            cargarArticulos(data.supplier_id);
        }
    }, [data.supplier_id]);

    const agregarDetalle = () => {
        setDetalles([...detalles, { articulo_id: null, quantity: 1, unit_price: 0 }]);
    };

    const eliminarDetalle = (index: number) => {
        const nuevosDetalles = detalles.filter((_, i) => i !== index);
        setDetalles(nuevosDetalles);
        setData('detalles', nuevosDetalles);
    };

    const actualizarDetalle = (index: number, campo: keyof DetalleForm, valor: any) => {
        const nuevosDetalles = [...detalles];
        nuevosDetalles[index] = { ...nuevosDetalles[index], [campo]: valor };
        
        if (campo === 'articulo_id') {
            const articulo = articulos.find(a => a.id === valor);
            if (articulo) {
                nuevosDetalles[index].unit_price = articulo.price;
            }
        }
        
        setDetalles(nuevosDetalles);
        setData('detalles', nuevosDetalles);
    };

    const calcularTotal = () => {
        return detalles.reduce((total, detalle) => {
            return total + (detalle.quantity * detalle.unit_price);
        }, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('orders.store'));
    };

    return (
        <AppLayout>
            <Head title="Nueva Orden de Compra" />
            
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={route('orders.index')} className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-sm hover:bg-accent">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <h1 className="text-2xl font-bold">Nueva Orden de Compra</h1>
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
                        <Link href={route('orders.index')}>
                            <Button variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            Guardar Orden
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
