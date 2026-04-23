import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Supplier {
    id: number;
    razonsocial: string;
}

interface Articulo {
    id: number;
    codarticulo: string;
    articulo: string;
    precio: number;
}

interface Props {
    suppliers: Supplier[];
    articulos: Articulo[];
}

interface DetalleForm {
    articulo_id: number | null;
    cantidad: number;
    precio_unitario: number;
}

export default function Create({ suppliers, articulos }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        numero_remito: '',
        fecha: new Date().toISOString().split('T')[0],
        supplier_id: '',
        observaciones: '',
        detalles: [] as DetalleForm[],
    });

    const [detalles, setDetalles] = useState<DetalleForm[]>([
        { articulo_id: null, cantidad: 1, precio_unitario: 0 }
    ]);

    const agregarDetalle = () => {
        setDetalles([...detalles, { articulo_id: null, cantidad: 1, precio_unitario: 0 }]);
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
                nuevosDetalles[index].precio_unitario = articulo.precio;
            }
        }
        
        setDetalles(nuevosDetalles);
        setData('detalles', nuevosDetalles);
    };

    const calcularTotal = () => {
        return detalles.reduce((total, detalle) => {
            return total + (detalle.cantidad * detalle.precio_unitario);
        }, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('compras.store'));
    };

    return (
        <AppLayout>
            <Head title="Nueva Compra" />
            
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={route('compras.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Nueva Compra</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información General</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="numero_remito">Nro. de Orden</Label>
                                    <Input
                                        id="numero_remito"
                                        value={data.numero_remito}
                                        onChange={(e) => setData('numero_remito', e.target.value)}
                                        error={errors.numero_remito}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="fecha">Fecha</Label>
                                    <Input
                                        id="fecha"
                                        type="date"
                                        value={data.fecha}
                                        onChange={(e) => setData('fecha', e.target.value)}
                                        error={errors.fecha}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="supplier_id">Proveedor</Label>
                                    <Select value={data.supplier_id} onValueChange={(value) => setData('supplier_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar proveedor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((supplier) => (
                                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                    {supplier.razonsocial}
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
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar artículo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {articulos.map((articulo) => (
                                                        <SelectItem key={articulo.id} value={articulo.id.toString()}>
                                                            {articulo.codarticulo} - {articulo.articulo}
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
                                                value={detalle.cantidad}
                                                onChange={(e) => actualizarDetalle(index, 'cantidad', parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Precio Unitario</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={detalle.precio_unitario}
                                                onChange={(e) => actualizarDetalle(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
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
                        <Link href={route('compras.index')}>
                            <Button variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            Guardar Compra
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}