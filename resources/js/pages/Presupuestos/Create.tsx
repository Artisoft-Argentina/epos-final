import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useState, useRef } from 'react';

interface Cliente {
    id: number;
    razonsocial: string;
}

interface Articulo {
    id: number;
    articulo: string;
    codarticulo: string;
    precio: number;
    categoria: { categoria: string };
    marca: { marca: string };
}

interface Props {
    clientes: Cliente[];
    articulos: Articulo[];
}

interface ArticuloPresupuesto {
    articulo_id: string;
    cantidad: number;
    precio: number;
}

export default function Create({ clientes, articulos }: Props) {
    const [articulosPresupuesto, setArticulosPresupuesto] = useState<ArticuloPresupuesto[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredArticulos, setFilteredArticulos] = useState<Articulo[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        cliente_id: '',
        articulos: [] as ArticuloPresupuesto[],
        total: 0,
    });

    const addArticulo = () => {
        setArticulosPresupuesto([...articulosPresupuesto, { articulo_id: '', cantidad: 1, precio: 0 }]);
    };

    const removeArticulo = (index: number) => {
        const newItems = articulosPresupuesto.filter((_, i) => i !== index);
        setArticulosPresupuesto(newItems);
        updateTotal(newItems);
    };

    const updateArticulo = (index: number, field: keyof ArticuloPresupuesto, value: any) => {
        const newItems = [...articulosPresupuesto];
        newItems[index] = { ...newItems[index], [field]: value };
        
        if (field === 'articulo_id') {
            const articulo = articulos.find(a => a.id.toString() === value);
            if (articulo) {
                newItems[index].precio = Number(articulo.precio);
            }
        }
        
        setArticulosPresupuesto(newItems);
        updateTotal(newItems);
    };

    const updateTotal = (items: ArticuloPresupuesto[]) => {
        const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
        setData('total', total);
        setData('articulos', items);
    };

    const calcularSubtotal = (item: ArticuloPresupuesto) => {
        return item.cantidad * item.precio;
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        if (value.length > 0) {
            const filtered = articulos.filter(articulo => 
                articulo.articulo.toLowerCase().includes(value.toLowerCase()) ||
                articulo.codarticulo.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredArticulos(filtered);
            setShowDropdown(true);
        } else {
            setShowDropdown(false);
        }
    };

    const addArticuloFromSearch = (articulo: Articulo) => {
        const newItem: ArticuloPresupuesto = {
            articulo_id: articulo.id.toString(),
            cantidad: 1,
            precio: Number(articulo.precio)
        };
        const newItems = [...articulosPresupuesto, newItem];
        setArticulosPresupuesto(newItems);
        updateTotal(newItems);
        setSearchTerm('');
        setShowDropdown(false);
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('presupuestos.store'));
    };

    return (
        <AppLayout>
            <Head title="Nuevo Presupuesto" />
            
            <div className="p-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Nuevo Presupuesto</h1>

                <form onSubmit={submit} className="space-y-6">
                    {/* Cliente */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Presupuesto</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-md">
                                <Label htmlFor="cliente_id">Cliente *</Label>
                                <Select value={data.cliente_id} onValueChange={(value) => setData('cliente_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clientes.map((cliente) => (
                                            <SelectItem key={cliente.id} value={cliente.id.toString()}>
                                                {cliente.razonsocial}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.cliente_id && <p className="text-sm text-red-600 mt-1">{errors.cliente_id}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Artículos */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Artículos</CardTitle>
                                <Button type="button" onClick={addArticulo} variant="outline">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar Línea
                                </Button>
                            </div>
                            <div className="mt-4 relative">
                                <Label>Búsqueda Rápida</Label>
                                <Input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Buscar artículo por código o nombre..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="mt-1"
                                />
                                {showDropdown && filteredArticulos.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {filteredArticulos.map((articulo) => (
                                            <div
                                                key={articulo.id}
                                                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center text-gray-900 dark:text-white"
                                                onClick={() => addArticuloFromSearch(articulo)}
                                            >
                                                <span>{articulo.codarticulo} - {articulo.articulo}</span>
                                                <span className="text-sm text-gray-500">${Number(articulo.precio).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {articulosPresupuesto.map((item, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border rounded-lg">
                                        <div>
                                            <Label>Código</Label>
                                            <Input 
                                                value={item.articulo_id ? articulos.find(a => a.id.toString() === item.articulo_id)?.codarticulo || '' : ''}
                                                readOnly
                                                className="bg-gray-50"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Artículo</Label>
                                            <Select 
                                                value={item.articulo_id} 
                                                onValueChange={(value) => updateArticulo(index, 'articulo_id', value)}
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
                                        <div className="max-w-20">
                                            <Label>Cant.</Label>
                                            <Input 
                                                type="number" 
                                                value={item.cantidad}
                                                onChange={(e) => updateArticulo(index, 'cantidad', parseInt(e.target.value) || 0)}
                                                min="1"
                                                className="text-center"
                                            />
                                        </div>
                                        <div>
                                            <Label>Precio</Label>
                                            <Input 
                                                type="number" 
                                                step="0.01"
                                                value={item.precio}
                                                onChange={(e) => updateArticulo(index, 'precio', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Subtotal</Label>
                                            <Input value={`$${calcularSubtotal(item).toFixed(2)}`} readOnly className="bg-gray-50" />
                                        </div>
                                        <div className="flex items-end">
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => removeArticulo(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <div className="text-xl font-bold">
                                    Total: ${data.total.toFixed(2)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Botones */}
                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing || articulosPresupuesto.length === 0}>
                            <Save className="w-4 h-4 mr-2" />
                            {processing ? 'Procesando...' : 'Guardar Presupuesto'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}