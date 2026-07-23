import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Save, X, Package, Camera, Search, Minus, User, ListOrdered, ScanLine, Warehouse as WarehouseIcon, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import QRScanner from '@/components/QRScanner';

interface Cliente {
    id: number;
    business_name: string;
    fantasy_name?: string | null;
}

interface ProductImage {
    id: number;
    path: string;
    is_primary: boolean;
}

interface Articulo {
    id: number;
    name: string;
    sku: string;
    category?: { id: number; name: string } | null;
    brand?: { id: number; name: string } | null;
    price_lists: { id: number; pivot: { price: number } }[];
    images: ProductImage[];
}

interface PriceList {
    id: number;
    name: string;
    percentage: number;
    default_pos: boolean;
    default_ecommerce: boolean;
}

interface PuntoVenta {
    id: number;
    name: string;
    pos_number: number;
    warehouse_id: number;
    warehouse?: { id: number; name: string };
}

interface Almacen {
    id: number;
    name: string;
    is_default: boolean;
}

interface WarehouseStock {
    warehouse_id: number;
    warehouse_name: string;
    quantity: number;
    is_pos_warehouse: boolean;
}

interface Props {
    clientes: Cliente[];
    articulos: Articulo[];
    listasPrecios: PriceList[];
    listaDefaultPos: PriceList | null;
    puntosVenta?: PuntoVenta[];
    almacenes?: Almacen[];
}

interface ArticuloVenta {
    articulo_id: string;
    cantidad: number;
    precio: number;
    warehouse_id: string;
}

export default function Create({ clientes, articulos, listasPrecios, listaDefaultPos, puntosVenta = [], almacenes = [] }: Props) {
    const page = usePage<any>();
    const activePosId = page.props.activePointOfSaleId as number | null;
    const activePos = puntosVenta.find((p) => p.id === activePosId) ?? puntosVenta[0];
    const defaultWarehouseId = activePos?.warehouse_id ?? almacenes.find((a) => a.is_default)?.id ?? almacenes[0]?.id ?? null;
    const [stockByProduct, setStockByProduct] = useState<Record<string, WarehouseStock[]>>({});
    const [articulosVenta, setArticulosVenta] = useState<ArticuloVenta[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredArticulos, setFilteredArticulos] = useState<Articulo[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [montoPagoInput, setMontoPagoInput] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        customer_id: '',
        articulos: [] as ArticuloVenta[],
        total: 0,
        surcharge: 0,
        additional_discount: 0,
        payment_method: 'efectivo',
        payment_amount: 0,
        auto_payment: true,
        auto_delivery: true,
        price_list_id: listaDefaultPos?.id?.toString() || '',
    });

    const addArticulo = () => {
        setArticulosVenta([...articulosVenta, { articulo_id: '', cantidad: 1, precio: 0, warehouse_id: defaultWarehouseId ? String(defaultWarehouseId) : '' }]);
    };

    const fetchStockForProduct = async (productId: string) => {
        if (stockByProduct[productId]) return;
        try {
            const url = route('products.stock-by-warehouse', productId) + (activePos ? `?pos_warehouse_id=${activePos.warehouse_id}` : '');
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (res.ok) {
                const data: WarehouseStock[] = await res.json();
                setStockByProduct((prev) => ({ ...prev, [productId]: data }));
            }
        } catch (e) {
            console.error('Error fetching stock:', e);
        }
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
                fetchStockForProduct(value);
            }
        }

        setArticulosVenta(newItems);
        updateTotal(newItems);
    };

    const updateTotal = (items: ArticuloVenta[]) => {
        const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
        const total = subtotal + data.surcharge - data.additional_discount;
        setData('total', total);
        setData('articulos', items);
        if (data.auto_payment) {
            setData('payment_amount', total);
        }
    };

    const updateTotalWithAdjustments = () => {
        const subtotal = articulosVenta.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
        const total = subtotal + data.surcharge - data.additional_discount;
        setData('total', total);
        if (data.auto_payment) {
            setData('payment_amount', total);
        }
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        if (value.length > 0) {
            const filtered = articulos.filter(articulo =>
                articulo.name.toLowerCase().includes(value.toLowerCase()) ||
                articulo.sku.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredArticulos(filtered);
            setShowDropdown(true);
        } else {
            setShowDropdown(false);
        }
    };

    const getPrecioArticulo = (articulo: Articulo) => {
        if (data.price_list_id) {
            const precioLista = articulo.price_lists?.find(lp => lp.id.toString() === data.price_list_id);
            if (precioLista) return Number(precioLista.pivot.price);
        }
        return 0;
    };

    const recalcularPrecios = (nuevaListaId: string) => {
        const itemsActualizados = articulosVenta.map(item => {
            if (item.articulo_id) {
                const articulo = articulos.find(a => a.id.toString() === item.articulo_id);
                if (articulo) {
                    const nuevoPrecio = nuevaListaId
                        ? articulo.price_lists?.find(lp => lp.id.toString() === nuevaListaId)?.pivot.price ?? 0
                        : 0;
                    return { ...item, precio: Number(nuevoPrecio) };
                }
            }
            return item;
        });
        setArticulosVenta(itemsActualizados);
        updateTotal(itemsActualizados);
    };

    const addArticuloFromSearch = (articulo: Articulo) => {
        const productId = articulo.id.toString();
        fetchStockForProduct(productId);
        const existingIndex = articulosVenta.findIndex(item => item.articulo_id === productId);
        if (existingIndex >= 0) {
            const newItems = [...articulosVenta];
            newItems[existingIndex].cantidad += 1;
            setArticulosVenta(newItems);
            updateTotal(newItems);
        } else {
            const newItem: ArticuloVenta = {
                articulo_id: productId,
                cantidad: 1,
                precio: getPrecioArticulo(articulo),
                warehouse_id: defaultWarehouseId ? String(defaultWarehouseId) : '',
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
                            <Select value={data.customer_id} onValueChange={(value) => setData('customer_id', value)}>
                                <SelectTrigger className="mt-1">
                                    <User className="text-muted-foreground mr-2 size-4" />
                                    <SelectValue placeholder="Seleccionar cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clientes.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.fantasy_name || c.business_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.customer_id && <p className="mt-1 text-xs text-destructive">{errors.customer_id}</p>}
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Lista de Precios</Label>
                            <Select value={data.price_list_id} onValueChange={(value) => { setData('price_list_id', value); recalcularPrecios(value); }}>
                                <SelectTrigger className="mt-1">
                                    <ListOrdered className="text-muted-foreground mr-2 size-4" />
                                    <SelectValue placeholder="Seleccionar lista" />
                                </SelectTrigger>
                                <SelectContent>
                                    {listasPrecios.map((l) => (
                                        <SelectItem key={l.id} value={l.id.toString()}>
                                            {l.name} {l.default_pos && '(POS)'}
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
                                    const img = articulo.images?.find(i => i.is_primary) || articulo.images?.[0];
                                    return (
                                        <div
                                            key={articulo.id}
                                            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent"
                                            onClick={() => addArticuloFromSearch(articulo)}
                                        >
                                            {img ? (
                                                <img src={`/storage/${img.path}`} alt={articulo.name} className="size-10 shrink-0 rounded-lg object-cover" />
                                            ) : (
                                                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                                                    <Package className="text-muted-foreground size-5" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{articulo.name}</p>
                                                <p className="text-muted-foreground text-xs">{articulo.sku} · {articulo.category?.name}</p>
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
                            const img = articulo?.images?.find(i => i.is_primary) || articulo?.images?.[0];
                            const stocks = stockByProduct[item.articulo_id] ?? [];
                            const selectedStock = stocks.find((s) => String(s.warehouse_id) === item.warehouse_id);
                            const stockHere = selectedStock?.quantity ?? 0;
                            const insufficient = item.articulo_id && item.cantidad > stockHere;
                            const otherStock = stocks.filter((s) => String(s.warehouse_id) !== item.warehouse_id && s.quantity >= item.cantidad);

                            return (
                                <div key={index} className="group rounded-xl border bg-card p-3 transition-colors hover:border-primary/20">
                                    <div className="flex items-center gap-3">
                                        {/* Image */}
                                        {img ? (
                                            <img src={`/storage/${img.path}`} alt={articulo?.name} className="size-12 shrink-0 rounded-lg object-cover" />
                                        ) : (
                                            <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-lg">
                                                <Package className="text-muted-foreground size-5" />
                                            </div>
                                        )}

                                        {/* Info + Select (if no articulo selected) */}
                                        <div className="min-w-0 flex-1">
                                            {articulo ? (
                                                <>
                                                    <p className="truncate text-sm font-semibold">{articulo.name}</p>
                                                    <p className="text-muted-foreground text-xs">{articulo.sku}</p>
                                                </>
                                            ) : (
                                                <Select value={item.articulo_id} onValueChange={(v) => updateArticulo(index, 'articulo_id', v)}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Seleccionar artículo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {articulos.map((a) => (
                                                            <SelectItem key={a.id} value={a.id.toString()}>
                                                                {a.sku} - {a.name}
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

                                    {/* Stock + Warehouse row */}
                                    {item.articulo_id && almacenes.length > 0 && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                                            <WarehouseIcon className="text-muted-foreground size-3.5" />
                                            <Select value={item.warehouse_id} onValueChange={(v) => updateArticulo(index, 'warehouse_id', v)}>
                                                <SelectTrigger className="h-7 w-auto min-w-[160px] text-xs">
                                                    <SelectValue placeholder="Almacén" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {almacenes.map((a) => {
                                                        const s = stocks.find((st) => st.warehouse_id === a.id);
                                                        return (
                                                            <SelectItem key={a.id} value={String(a.id)}>
                                                                {a.name} {s ? `(${s.quantity})` : '(0)'}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            <Badge variant={insufficient ? 'destructive' : 'secondary'} className="text-[10px] tabular-nums">
                                                Stock: {stockHere}
                                            </Badge>
                                            {insufficient && otherStock.length > 0 && (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <AlertTriangle className="text-warning size-3.5" />
                                                    <span className="text-warning">Disponible en:</span>
                                                    {otherStock.slice(0, 2).map((s) => (
                                                        <Button
                                                            key={s.warehouse_id}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 px-2 text-[10px]"
                                                            onClick={() => updateArticulo(index, 'warehouse_id', String(s.warehouse_id))}
                                                        >
                                                            {s.warehouse_name} ({s.quantity})
                                                        </Button>
                                                    ))}
                                                    <a
                                                        href={route('transferencias.create')}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-[10px] underline"
                                                    >
                                                        <ArrowRightLeft className="size-3" />
                                                        Solicitar transferencia
                                                    </a>
                                                </div>
                                            )}
                                            {insufficient && otherStock.length === 0 && (
                                                <div className="flex items-center gap-1 text-xs text-destructive">
                                                    <AlertTriangle className="size-3.5" />
                                                    Sin stock suficiente en ningún almacén
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                                    value={data.surcharge.toString()}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        const n = v.includes('.') ? parseFloat(v) : parseFloat(v + '.00');
                                        setData('surcharge', isNaN(n) ? 0 : n);
                                        setTimeout(updateTotalWithAdjustments, 0);
                                    }}
                                    className="h-7 w-24 text-right text-sm tabular-nums"
                                />
                            </div>
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <Label className="text-muted-foreground text-sm font-normal">Descuento</Label>
                                <Input
                                    type="text"
                                    value={data.additional_discount.toString()}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        const n = v.includes('.') ? parseFloat(v) : parseFloat(v + '.00');
                                        setData('additional_discount', isNaN(n) ? 0 : n);
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
                            <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
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
                                        onFocus={() => setMontoPagoInput(data.payment_amount > 0 ? data.payment_amount.toString() : '')}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) {
                                                setMontoPagoInput(v);
                                                const n = parseFloat(v);
                                                if (!isNaN(n)) setData('payment_amount', n);
                                                else if (v === '') setData('payment_amount', 0);
                                            }
                                        }}
                                        onBlur={() => setMontoPagoInput(data.payment_amount.toFixed(2))}
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
                                            if (val) setData('payment_amount', data.total);
                                            else setData('payment_amount', 0);
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

                            {data.payment_amount < data.total && data.payment_amount > 0 && (
                                <div className="rounded-lg bg-warning-soft p-3">
                                    <p className="text-warning text-xs font-medium">
                                        Pago parcial — Saldo pendiente: ${(data.total - data.payment_amount).toFixed(2)}
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
                            disabled={processing || articulosVenta.length === 0 || data.payment_amount > data.total}
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
