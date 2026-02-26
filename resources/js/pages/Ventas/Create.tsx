import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, X, Package, Camera } from 'lucide-react';
import { useState, useRef } from 'react';
import QRScanner from '@/components/QRScanner';

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
    listas_precios: { id: number; pivot: { precio: number } }[];
    imagenes: { id: number; ruta: string; principal: boolean }[];
}

interface ListaPrecio {
    id: number;
    nombre: string;
    porcentaje: number;
    default_pos: boolean;
    default_ecommerce: boolean;
}

interface Props {
    clientes: Cliente[];
    articulos: Articulo[];
    listasPrecios: ListaPrecio[];
    listaDefaultPos: ListaPrecio | null;
}

interface ArticuloVenta {
    articulo_id: string;
    cantidad: number;
    precio: number;
}

export default function Create({ clientes, articulos, listasPrecios, listaDefaultPos }: Props) {
    const [articulosVenta, setArticulosVenta] = useState<ArticuloVenta[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredArticulos, setFilteredArticulos] = useState<Articulo[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        cliente_id: '',
        articulos: [] as ArticuloVenta[],
        total: 0,
        recargo: 0,
        descuento: 0,
        metodo_pago: 'efectivo',
        monto_pago: 0,
        auto_payment: true,
        auto_delivery: true,
        lista_precio_id: listaDefaultPos?.id?.toString() || '',
    });

    const addArticulo = () => {
        setArticulosVenta([...articulosVenta, { articulo_id: '', cantidad: 1, precio: 0 }]);
    };

    const removeArticulo = (index: number) => {
        const newItems = articulosVenta.filter((_, i) => i !== index);
        setArticulosVenta(newItems);
        updateTotal(newItems);
    };

    const updateArticulo = (index: number, field: keyof ArticuloVenta, value: any) => {
        const newItems = [...articulosVenta];
        newItems[index] = { ...newItems[index], [field]: value };
        
        if (field === 'articulo_id') {
            const articulo = articulos.find(a => a.id.toString() === value);
            if (articulo) {
                const precioLista = getPrecioArticulo(articulo);
                newItems[index].precio = precioLista;
            }
        }
        
        setArticulosVenta(newItems);
        updateTotal(newItems);
    };

    const calcularSubtotal = (item: ArticuloVenta) => {
        return item.cantidad * item.precio;
    };

    const updateTotal = (items: ArticuloVenta[]) => {
        const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
        const total = subtotal + data.recargo - data.descuento;
        setData('total', total);
        setData('articulos', items);
        if (data.auto_payment) {
            setData('monto_pago', total);
        }
    };

    const updateTotalWithAdjustments = () => {
        const subtotal = articulosVenta.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
        const total = subtotal + data.recargo - data.descuento;
        setData('total', total);
        if (data.auto_payment) {
            setData('monto_pago', total);
        }
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

    const getPrecioArticulo = (articulo: Articulo) => {
        if (data.lista_precio_id) {
            const precioLista = articulo.listasPrecios?.find(lp => lp.id.toString() === data.lista_precio_id);
            if (precioLista) {
                return Number(precioLista.pivot.precio);
            }
        }
        return Number(articulo.precio);
    };

    const recalcularPrecios = (nuevaListaId: string) => {
        const itemsActualizados = articulosVenta.map(item => {
            if (item.articulo_id) {
                const articulo = articulos.find(a => a.id.toString() === item.articulo_id);
                if (articulo) {
                    const nuevoPrecio = nuevaListaId ? 
                        articulo.listasPrecios?.find(lp => lp.id.toString() === nuevaListaId)?.pivot.precio || articulo.precio :
                        articulo.precio;
                    return { ...item, precio: Number(nuevoPrecio) };
                }
            }
            return item;
        });
        setArticulosVenta(itemsActualizados);
        updateTotal(itemsActualizados);
    };

    const addArticuloFromSearch = (articulo: Articulo) => {
        const newItem: ArticuloVenta = {
            articulo_id: articulo.id.toString(),
            cantidad: 1,
            precio: getPrecioArticulo(articulo)
        };
        const newItems = [...articulosVenta, newItem];
        setArticulosVenta(newItems);
        updateTotal(newItems);
        setSearchTerm('');
        setShowDropdown(false);
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const handleScanResult = async (codigo: string) => {
        setIsScanning(false);
        console.log('Código escaneado:', codigo);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            console.log('CSRF Token:', csrfToken ? 'Presente' : 'FALTA');
            
            const response = await fetch('/scanner/buscar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ codigo }),
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Datos recibidos:', data);
                
                if (data.articulo) {
                    const articuloEncontrado = articulos.find(a => a.id === data.articulo.id);
                    if (articuloEncontrado) {
                        console.log('Artículo encontrado, agregando...');
                        addArticuloFromSearch(articuloEncontrado);
                        alert('✅ Artículo agregado: ' + articuloEncontrado.articulo);
                    } else {
                        console.error('Artículo no encontrado en la lista');
                        alert('⚠️ Artículo no disponible en esta lista');
                    }
                } else {
                    console.error('No se encontró el artículo');
                    alert('❌ Artículo no encontrado: ' + codigo);
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
                console.error('Error en respuesta:', response.status, errorData);
                alert('❌ Error ' + response.status + ': ' + (errorData.error || 'Error al buscar'));
            }
        } catch (error) {
            console.error('Error al buscar artículo:', error);
            alert('❌ Error de conexión: ' + (error instanceof Error ? error.message : 'Error desconocido'));
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('ventas.store'));
    };

    return (
        <AppLayout>
            <Head title="Nueva Venta" />
            
            <div className="p-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Nueva Venta</h1>

                <form onSubmit={submit} className="space-y-6">
                    {/* Cliente */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de la Venta</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
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
                                <div>
                                    <Label htmlFor="lista_precio_id">Lista de Precios</Label>
                                    <Select value={data.lista_precio_id} onValueChange={(value) => {
                                        setData('lista_precio_id', value);
                                        recalcularPrecios(value);
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar lista" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {listasPrecios.map((lista) => (
                                                <SelectItem key={lista.id} value={lista.id.toString()}>
                                                    {lista.nombre} {lista.default_pos && '(POS Default)'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    {/* Artículos */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Artículos</CardTitle>
                                <div className="flex gap-2">
                                    <Button 
                                        type="button" 
                                        onClick={() => setIsScanning(true)} 
                                        variant="outline"
                                        size="icon"
                                        title="Escanear QR"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </Button>
                                    <Button type="button" onClick={addArticulo} variant="outline" size="icon" title="Agregar Línea">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
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
                                        {filteredArticulos.map((articulo) => {
                                            const imagenPrincipal = articulo.imagenes?.find(img => img.principal) || articulo.imagenes?.[0];
                                            return (
                                                <div
                                                    key={articulo.id}
                                                    className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3 text-gray-900 dark:text-white"
                                                    onClick={() => addArticuloFromSearch(articulo)}
                                                >
                                                    {imagenPrincipal ? (
                                                        <img 
                                                            src={`/storage/${imagenPrincipal.ruta}`} 
                                                            alt={articulo.articulo}
                                                            className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                                                            <Package className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{articulo.codarticulo} - {articulo.articulo}</div>
                                                        <div className="text-sm text-gray-500">{articulo.categoria.categoria} • {articulo.marca.marca}</div>
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">${Number(articulo.precio).toFixed(2)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {articulosVenta.map((item, index) => {
                                    const articulo = articulos.find(a => a.id.toString() === item.articulo_id);
                                    const imagenPrincipal = articulo?.imagenes?.find(img => img.principal) || articulo?.imagenes?.[0];
                                    
                                    return (
                                        <div key={index} className="p-4 border rounded-lg space-y-4 md:space-y-0 md:grid md:grid-cols-7 md:gap-4">
                                            <div>
                                                <Label>Imagen</Label>
                                                <div className="mt-1">
                                                    {imagenPrincipal ? (
                                                        <img 
                                                            src={`/storage/${imagenPrincipal.ruta}`} 
                                                            alt={articulo?.articulo || ''}
                                                            className="w-16 h-16 object-cover rounded-md border"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center border">
                                                            <Package className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
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
                                            <div className="md:max-w-20">
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
                                            <Input value={`$${calcularSubtotal(item).toFixed(2)}`} readOnly />
                                            </div>
                                            <div className="flex items-end md:items-end">
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
                                    );
                                })}
                            </div>
                            
                            <div className="mt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="recargo">Recargo</Label>
                                        <Input
                                            id="recargo"
                                            type="text"
                                            min="0"
                                            value={data.recargo.toString()}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const numValue = value.includes('.') ? parseFloat(value) : parseFloat(value + '.00');
                                                setData('recargo', isNaN(numValue) ? 0 : numValue);
                                                setTimeout(updateTotalWithAdjustments, 0);
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="descuento">Descuento</Label>
                                        <Input
                                            id="descuento"
                                            type="text"
                                            min="0"
                                            value={data.descuento.toString()}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const numValue = value.includes('.') ? parseFloat(value) : parseFloat(value + '.00');
                                                setData('descuento', isNaN(numValue) ? 0 : numValue);
                                                setTimeout(updateTotalWithAdjustments, 0);
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <div className="text-xl font-bold">
                                            Total: ${data.total.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pago */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Pago</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="metodo_pago">Método de Pago</Label>
                                    <Select value={data.metodo_pago} onValueChange={(value) => setData('metodo_pago', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="efectivo">Efectivo</SelectItem>
                                            <SelectItem value="tarjeta_debito">Tarjeta de Débito</SelectItem>
                                            <SelectItem value="tarjeta_credito">Tarjeta de Crédito</SelectItem>
                                            <SelectItem value="transferencia">Transferencia</SelectItem>
                                            <SelectItem value="mercadopago">MercadoPago</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="monto_pago">Monto del Pago</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={data.total}
                                        value={data.monto_pago.toFixed(2)}
                                        onChange={(e) => setData('monto_pago', parseFloat(parseFloat(e.target.value).toFixed(2)) || 0)}
                                        disabled={data.auto_payment}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        id="auto_payment" 
                                        checked={data.auto_payment}
                                        onChange={(e) => {
                                            setData('auto_payment', e.target.checked);
                                            if (e.target.checked) {
                                                setData('monto_pago', data.total);
                                            } else {
                                                setData('monto_pago', 0);
                                            }
                                        }}
                                        className="rounded"
                                    />
                                    <Label htmlFor="auto_payment">Crear pago automático por el total</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        id="auto_delivery" 
                                        checked={data.auto_delivery}
                                        onChange={(e) => setData('auto_delivery', e.target.checked)}
                                        className="rounded"
                                    />
                                    <Label htmlFor="auto_delivery">Crear entrega automática de todos los productos</Label>
                                </div>
                            </div>
                            {data.monto_pago < data.total && data.monto_pago > 0 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Pago Parcial:</strong> Saldo pendiente: ${(data.total - data.monto_pago).toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Botones */}
                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing || articulosVenta.length === 0 || data.monto_pago > data.total}>
                            <Save className="w-4 h-4 mr-2" />
                            {processing ? 'Procesando...' : 'Guardar Venta'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>

            <QRScanner
                isActive={isScanning}
                onScan={handleScanResult}
                onClose={() => setIsScanning(false)}
                onError={(error) => {
                    console.error('Scanner error:', error);
                    setIsScanning(false);
                }}
            />
        </AppLayout>
    );
}