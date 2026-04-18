import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Save, X, Package, Camera, Search, Minus, User, ListOrdered, ScanLine } from 'lucide-react';
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
    const [montoPagoInput, setMontoPagoInput] = useState('');
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
                newItems[index].precio = getPrecioArticulo(articulo);
            }
        }

        setArticulosVenta(newItems);
        updateTotal(newItems);
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
            if (precioLista) return Number(precioLista.pivot.precio);
        }
        return Number(articulo.precio);
    };

    const recalcularPrecios = (nuevaListaId: string) => {
        const itemsActualizados = articulosVenta.map(item => {
            if (item.articulo_id) {
                const articulo = articulos.find(a => a.id.toString() === item.articulo_id);
                if (articulo) {
                    const nuevoPrecio = nuevaListaId
                        ? articulo.listasPrecios?.find(lp => lp.id.toString() === nuevaListaId)?.pivot.precio || articulo.precio
                        : articulo.precio;
                    return { ...item, precio: Number(nuevoPrecio) };
                }
            }
            return item;
        });
        setArticulosVenta(itemsActualizados);
        updateTotal(itemsActualizados);
    };

    const addArticuloFromSearch = (articulo: Articulo) => {
        const existingIndex = articulosVenta.findIndex(item => item.articulo_id === articulo.id.toString());
        if (existingIndex >= 0) {
            const newItems = [...articulosVenta];
            newItems[existingIndex].cantidad += 1;
            setArticulosVenta(newItems);
            updateTotal(newItems);
        } else {
            const newItem: ArticuloVenta = {
                articulo_id: articulo.id.toString(),
                cantidad: 1,
                precio: getPrecioArticulo(articulo),
            };
            const newItems = [...articulosVenta, newItem];
            setArticulosVenta(newItems);
            updateTotal(newItems);
        }
        setSearchTerm('');
        setShowDropdown(false);
        searchInputRef.current?.focus();
    };

    const handleScanResult = async (codigo: string) => {
        setIsScanning(false);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/scanner/buscar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken || '' },
                body: JSON.stringify({ codigo }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.articulo) {
                    const found = articulos.find(a => a.id === data.articulo.id);
                    if (found) addArticuloFromSearch(found);
                }
            }
        } catch (error) {
            console.error('Error al buscar artículo:', error);
        }
    };

    const subtotal = articulosVenta.reduce((sum, item) => sum + item.cantidad * item.precio, 0);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('ventas.store'));
    };

    return (
        <AppLayout>
            <Head title="Nueva Venta" />

            <form onSubmit={submit} className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden lg:flex-row">
                {/* LEFT PANEL — Search + Cart Items */}
                <div className="flex flex-1 flex-col overflow-hidden p-4 md:p-6">
                    {/* Header: Cliente + Lista + Actions */}
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Cliente</Label>
                            <Select value={data.cliente_id} onValueChange={(value) => setData('cliente_id', value)}>
                                <SelectTrigger className="mt-1">
                                    <User className="text-muted-foreground mr-2 size-4" />
                                    <SelectValue placeholder="Seleccionar cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clientes.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.razonsocial}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.cliente_id && <p className="mt-1 text-xs text-destructive">{errors.cliente_id}</p>}
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Lista de Precios</Label>
                            <Select value={data.lista_precio_id} onValueChange={(value) => { setData('lista_precio_id', value); recalcularPrecios(value); }}>
                                <SelectTrigger className="mt-1">
                                    <ListOrdered className="text-muted-foreground mr-2 size-4" />
                                    <SelectValue placeholder="Seleccionar lista" />
                                </SelectTrigger>
                                <SelectContent>
                                    {listasPrecios.map((l) => (
                                        <SelectItem key={l.id} value={l.id.toString()}>
                                            {l.nombre} {l.default_pos && '(POS)'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="icon" onClick={() => setIsScanning(true)} title="Escanear QR">
                                <Camera className="size-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" onClick={addArticulo} title="Agregar línea manual">
                                <Plus className="size-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Buscar artículo por código o nombre..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                        />
                        {showDropdown && filteredArticulos.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full overflow-auto rounded-lg border bg-card shadow-lg max-h-72">
                                {filteredArticulos.map((articulo) => {
                                    const img = articulo.imagenes?.find(i => i.principal) || articulo.imagenes?.[0];
                                    return (
                                        <div
                                            key={articulo.id}
                                            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent"
                                            onClick={() => addArticuloFromSearch(articulo)}
                                        >
                                            {img ? (
                                                <img src={`/storage/${img.ruta}`} alt={articulo.articulo} className="size-10 shrink-0 rounded-lg object-cover" />
                                            ) : (
                                                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                                                    <Package className="text-muted-foreground size-5" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{articulo.articulo}</p>
                                                <p className="text-muted-foreground text-xs">{articulo.codarticulo} · {articulo.categoria?.categoria}</p>
                                            </div>
                                            <span className="text-primary shrink-0 text-sm font-bold tabular-nums">
                                                ${getPrecioArticulo(articulo).toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                        {articulosVenta.length === 0 && (
                            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
                                <ScanLine className="size-10 opacity-30" />
                                <p className="text-sm">Buscá o escaneá un artículo para comenzar</p>
                            </div>
                        )}
                        {articulosVenta.map((item, index) => {
                            const articulo = articulos.find(a => a.id.toString() === item.articulo_id);
                            const img = articulo?.imagenes?.find(i => i.principal) || articulo?.imagenes?.[0];

                            return (
                                <div key={index} className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/20">
                                    {/* Image */}
                                    {img ? (
                                        <img src={`/storage/${img.ruta}`} alt={articulo?.articulo} className="size-12 shrink-0 rounded-lg object-cover" />
                                    ) : (
                                        <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-lg">
                                            <Package className="text-muted-foreground size-5" />
                                        </div>
                                    )}

                                    {/* Info + Select (if no articulo selected) */}
                                    <div className="min-w-0 flex-1">
                                        {articulo ? (
                                            <>
                                                <p className="truncate text-sm font-semibold">{articulo.articulo}</p>
                                                <p className="text-muted-foreground text-xs">{articulo.codarticulo}</p>
                                            </>
                                        ) : (
                                            <Select value={item.articulo_id} onValueChange={(v) => updateArticulo(index, 'articulo_id', v)}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Seleccionar artículo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {articulos.map((a) => (
                                                        <SelectItem key={a.id} value={a.id.toString()}>
                                                            {a.codarticulo} - {a.articulo}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            className="bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary flex size-7 items-center justify-center rounded-full transition-colors"
                                            onClick={() => {
                                                if (item.cantidad > 1) updateArticulo(index, 'cantidad', item.cantidad - 1);
                                            }}
                                        >
                                            <Minus className="size-3.5" />
                                        </button>
                                        <Input
                                            type="number"
                                            value={item.cantidad}
                                            onChange={(e) => updateArticulo(index, 'cantidad', parseInt(e.target.value) || 1)}
                                            min={1}
                                            className="h-7 w-10 border-0 bg-transparent p-0 text-center text-sm font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        />
                                        <button
                                            type="button"
                                            className="bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary flex size-7 items-center justify-center rounded-full transition-colors"
                                            onClick={() => updateArticulo(index, 'cantidad', item.cantidad + 1)}
                                        >
                                            <Plus className="size-3.5" />
                                        </button>
                                    </div>

                                    {/* Price */}
                                    <div className="w-20 text-right">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.precio}
                                            onChange={(e) => updateArticulo(index, 'precio', parseFloat(e.target.value) || 0)}
                                            className="h-7 border-0 bg-transparent p-0 text-right text-sm font-bold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        />
                                        {item.cantidad > 1 && (
                                            <p className="text-muted-foreground text-[10px] tabular-nums">
                                                Sub: ${(item.cantidad * item.precio).toFixed(2)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Delete */}
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 transition-all group-hover:opacity-100"
                                        onClick={() => removeArticulo(index)}
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT PANEL — Order Summary (sticky) */}
                <div className="flex w-full flex-col border-t bg-card lg:w-[380px] lg:border-l lg:border-t-0">
                    {/* Panel Header */}
                    <div className="border-b p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold tracking-tight">Resumen</h2>
                            <Badge variant="secondary" className="tabular-nums">
                                {articulosVenta.length} {articulosVenta.length === 1 ? 'item' : 'items'}
                            </Badge>
                        </div>
                    </div>

                    {/* Scrollable middle section */}
                    <div className="flex-1 space-y-5 overflow-y-auto p-5">
                        {/* Totals */}
                        <div className="space-y-2.5">
                            <div className="text-muted-foreground flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <Label className="text-muted-foreground text-sm font-normal">Recargo</Label>
                                <Input
                                    type="text"
                                    value={data.recargo.toString()}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        const n = v.includes('.') ? parseFloat(v) : parseFloat(v + '.00');
                                        setData('recargo', isNaN(n) ? 0 : n);
                                        setTimeout(updateTotalWithAdjustments, 0);
                                    }}
                                    className="h-7 w-24 text-right text-sm tabular-nums"
                                />
                            </div>
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <Label className="text-muted-foreground text-sm font-normal">Descuento</Label>
                                <Input
                                    type="text"
                                    value={data.descuento.toString()}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        const n = v.includes('.') ? parseFloat(v) : parseFloat(v + '.00');
                                        setData('descuento', isNaN(n) ? 0 : n);
                                        setTimeout(updateTotalWithAdjustments, 0);
                                    }}
                                    className="h-7 w-24 text-right text-sm tabular-nums"
                                />
                            </div>
                            <div className="flex items-center justify-between border-t pt-3">
                                <span className="text-base font-semibold">Total</span>
                                <span className="text-primary text-2xl font-bold tabular-nums">${data.total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold">Pago</h3>
                            <Select value={data.metodo_pago} onValueChange={(v) => setData('metodo_pago', v)}>
                                <SelectTrigger className="h-9">
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

                            {!data.auto_payment && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Monto del Pago</Label>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={montoPagoInput}
                                        onFocus={() => setMontoPagoInput(data.monto_pago > 0 ? data.monto_pago.toString() : '')}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) {
                                                setMontoPagoInput(v);
                                                const n = parseFloat(v);
                                                if (!isNaN(n)) setData('monto_pago', n);
                                                else if (v === '') setData('monto_pago', 0);
                                            }
                                        }}
                                        onBlur={() => setMontoPagoInput(data.monto_pago.toFixed(2))}
                                        placeholder="0.00"
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="auto_payment"
                                        checked={data.auto_payment}
                                        onCheckedChange={(checked) => {
                                            const val = !!checked;
                                            setData('auto_payment', val);
                                            if (val) setData('monto_pago', data.total);
                                            else setData('monto_pago', 0);
                                        }}
                                    />
                                    <Label htmlFor="auto_payment" className="text-xs">Pago automático por el total</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="auto_delivery"
                                        checked={data.auto_delivery}
                                        onCheckedChange={(checked) => setData('auto_delivery', !!checked)}
                                    />
                                    <Label htmlFor="auto_delivery" className="text-xs">Entrega automática de productos</Label>
                                </div>
                            </div>

                            {data.monto_pago < data.total && data.monto_pago > 0 && (
                                <div className="rounded-lg bg-warning-soft p-3">
                                    <p className="text-warning text-xs font-medium">
                                        Pago parcial — Saldo pendiente: ${(data.total - data.monto_pago).toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 border-t p-4">
                        <Button type="button" variant="outline" onClick={() => window.history.back()} className="col-span-1">
                            <X className="size-4" />
                            Cancelar
                        </Button>
                        <Button type="button" variant="secondary" onClick={addArticulo} className="col-span-1">
                            <Plus className="size-4" />
                            Línea
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || articulosVenta.length === 0 || data.monto_pago > data.total}
                            className="col-span-2"
                            size="lg"
                        >
                            <Save className="size-4" />
                            {processing ? 'Procesando...' : 'Finalizar Venta'}
                        </Button>
                    </div>
                </div>
            </form>

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
