import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { MoneyInput } from '@/components/ui/money-input';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Save, X, Package, Camera, Search, Minus, ListOrdered, ScanLine, Warehouse as WarehouseIcon, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import QRScanner from '@/components/QRScanner';

interface Customer {
    id: number;
    business_name: string;
    fantasy_name?: string | null;
    tax_status?: string | null;
}

interface ProductImage {
    id: number;
    path: string;
    is_primary: boolean;
}

interface Product {
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

interface PointOfSale {
    id: number;
    name: string;
    pos_number: number;
    warehouse_id: number;
    warehouse?: { id: number; name: string };
}

interface Warehouse {
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

interface SaleItem {
    product_id: string;
    quantity: number;
    price: number;
    warehouse_id: string;
}

interface Props {
    customers: Customer[];
    products: Product[];
    priceLists: PriceList[];
    defaultPosList: PriceList | null;
    pointsOfSale?: PointOfSale[];
    warehouses?: Warehouse[];
}

interface PageProps {
    activePointOfSaleId: number | null;
    [key: string]: unknown;
}

const fmt = (n: number): string => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Deriva la letra de comprobante (A/B) según la condición IVA del cliente. */
function resolveVoucherLetter(taxStatus?: string | null): 'A' | 'B' {
    if (!taxStatus) return 'B';
    const code = taxStatus.trim().toUpperCase();
    if (code === 'RI' || code === 'MO') return 'A';
    if (code === 'CF' || code === 'EX') return 'B';
    const lower = taxStatus.toLowerCase();
    if (lower.includes('responsable inscripto') || lower.includes('monotributo')) return 'A';
    return 'B';
}

export default function Create({ customers, products, priceLists, defaultPosList, pointsOfSale = [], warehouses = [] }: Props) {
    const page = usePage<PageProps>();
    const activePosId = page.props.activePointOfSaleId;
    const activePos = pointsOfSale.find((p) => p.id === activePosId) ?? pointsOfSale[0];
    const defaultWarehouseId = activePos?.warehouse_id ?? warehouses.find((w) => w.is_default)?.id ?? warehouses[0]?.id ?? null;

    const [stockByProduct, setStockByProduct] = useState<Record<string, WarehouseStock[]>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        customer_id: '',
        items: [] as SaleItem[],
        surcharge: 0,
        additional_discount: 0,
        payment_method: 'efectivo',
        payment_amount: 0,
        auto_payment: true,
        auto_delivery: true,
        price_list_id: defaultPosList?.id?.toString() || '',
    });

    const items = data.items;

    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.price, 0), [items]);
    const total = useMemo(
        () => subtotal + Number(data.surcharge) - Number(data.additional_discount),
        [subtotal, data.surcharge, data.additional_discount],
    );

    // Fuente única de verdad: si el pago es automático, sigue al total (sin setTimeout).
    useEffect(() => {
        if (data.auto_payment) {
            setData('payment_amount', total);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [total, data.auto_payment]);

    const priceForProduct = (product: Product): number => {
        if (data.price_list_id) {
            const listed = product.price_lists?.find((lp) => lp.id.toString() === data.price_list_id);
            if (listed) return Number(listed.pivot.price);
        }
        return 0;
    };

    const fetchStockForProduct = async (productId: string) => {
        if (stockByProduct[productId]) return;
        try {
            const url = route('products.stock-by-warehouse', productId) + (activePos ? `?pos_warehouse_id=${activePos.warehouse_id}` : '');
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (res.ok) {
                const stock: WarehouseStock[] = await res.json();
                setStockByProduct((prev) => ({ ...prev, [productId]: stock }));
            }
        } catch (e) {
            console.error('Error fetching stock:', e);
        }
    };

    const addEmptyItem = () => {
        setData('items', [
            ...items,
            { product_id: '', quantity: 1, price: 0, warehouse_id: defaultWarehouseId ? String(defaultWarehouseId) : '' },
        ]);
    };

    const removeItem = (index: number) => {
        setData('items', items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, patch: Partial<SaleItem>) => {
        const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
        setData('items', next);
    };

    const selectProductForLine = (index: number, productId: string) => {
        const product = products.find((p) => p.id.toString() === productId);
        updateItem(index, { product_id: productId, price: product ? priceForProduct(product) : 0 });
        if (product) fetchStockForProduct(productId);
    };

    const addProductFromSearch = (product: Product) => {
        const productId = product.id.toString();
        fetchStockForProduct(productId);
        const existingIndex = items.findIndex((item) => item.product_id === productId);
        if (existingIndex >= 0) {
            updateItem(existingIndex, { quantity: items[existingIndex].quantity + 1 });
        } else {
            setData('items', [
                ...items,
                {
                    product_id: productId,
                    quantity: 1,
                    price: priceForProduct(product),
                    warehouse_id: defaultWarehouseId ? String(defaultWarehouseId) : '',
                },
            ]);
        }
        setSearchTerm('');
        setShowDropdown(false);
        searchInputRef.current?.focus();
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        if (value.length > 0) {
            const term = value.toLowerCase();
            setFilteredProducts(
                products.filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)),
            );
            setShowDropdown(true);
        } else {
            setShowDropdown(false);
        }
    };

    const changePriceList = (priceListId: string) => {
        setData((prev) => ({
            ...prev,
            price_list_id: priceListId,
            items: prev.items.map((item) => {
                if (!item.product_id) return item;
                const product = products.find((p) => p.id.toString() === item.product_id);
                if (!product) return item;
                const listed = priceListId ? product.price_lists?.find((lp) => lp.id.toString() === priceListId) : undefined;
                return { ...item, price: listed ? Number(listed.pivot.price) : 0 };
            }),
        }));
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
                const result = await response.json();
                if (result.articulo) {
                    const found = products.find((p) => p.id === result.articulo.id);
                    if (found) addProductFromSearch(found);
                }
            }
        } catch (error) {
            console.error('Error al buscar artículo:', error);
        }
    };

    const selectedCustomer = customers.find((c) => c.id.toString() === data.customer_id);
    const voucherLetter = resolveVoucherLetter(selectedCustomer?.tax_status);

    const hasEmptyLine = items.some((item) => !item.product_id);
    const partialPayment = data.payment_amount < total && data.payment_amount > 0;
    const itemErrorKeys = Object.keys(errors).filter((k) => k.startsWith('items'));
    const canSubmit = !processing && !!data.customer_id && items.length > 0 && !hasEmptyLine && data.payment_amount <= total;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sales.store'));
    };

    return (
        <AppLayout>
            <Head title="Nueva Venta" />

            <form onSubmit={submit} className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden lg:flex-row">
                {/* LEFT PANEL — Cliente + búsqueda + carrito */}
                <div className="flex flex-1 flex-col overflow-hidden p-4 md:p-6">
                    {/* Header: Cliente + Lista + acciones */}
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <FormField label="Cliente" required error={errors.customer_id}>
                                <Combobox
                                    options={customers.map((c) => ({ value: c.id.toString(), label: c.fantasy_name || c.business_name }))}
                                    value={data.customer_id}
                                    onValueChange={(value) => setData('customer_id', value)}
                                    placeholder="Seleccionar cliente"
                                    searchPlaceholder="Buscar cliente..."
                                    emptyMessage="No se encontraron clientes."
                                    error={errors.customer_id}
                                />
                            </FormField>
                        </div>
                        <div className="flex-1">
                            <FormField label="Lista de Precios">
                                <Select value={data.price_list_id} onValueChange={changePriceList}>
                                    <SelectTrigger>
                                        <ListOrdered className="text-muted-foreground mr-2 size-4" />
                                        <SelectValue placeholder="Seleccionar lista" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priceLists.map((l) => (
                                            <SelectItem key={l.id} value={l.id.toString()}>
                                                {l.name} {l.default_pos && '(POS)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                        </div>
                        <div className="flex gap-2 pb-0.5">
                            <Button type="button" variant="outline" size="icon" onClick={() => setIsScanning(true)} title="Escanear QR">
                                <Camera className="size-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" onClick={addEmptyItem} title="Agregar línea manual">
                                <Plus className="size-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Buscador */}
                    <div className="relative mb-4">
                        <Input
                            ref={searchInputRef}
                            type="text"
                            startIcon={<Search className="size-4" />}
                            placeholder="Buscar artículo por código o nombre..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {showDropdown && filteredProducts.length > 0 && (
                            <div className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-card shadow-lg">
                                {filteredProducts.map((product) => {
                                    const img = product.images?.find((i) => i.is_primary) || product.images?.[0];
                                    return (
                                        <div
                                            key={product.id}
                                            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent"
                                            onClick={() => addProductFromSearch(product)}
                                        >
                                            {img ? (
                                                <img src={`/storage/${img.path}`} alt={product.name} className="size-10 shrink-0 rounded-lg object-cover" />
                                            ) : (
                                                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                                                    <Package className="text-muted-foreground size-5" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{product.name}</p>
                                                <p className="text-muted-foreground text-xs">{product.sku} · {product.category?.name}</p>
                                            </div>
                                            <span className="text-primary shrink-0 text-sm font-bold tabular-nums">{fmt(priceForProduct(product))}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {itemErrorKeys.length > 0 && (
                        <Alert variant="destructive" className="mb-3">
                            <AlertTriangle className="size-4" />
                            <AlertDescription>Revisá los artículos: hay líneas con datos inválidos.</AlertDescription>
                        </Alert>
                    )}

                    {/* Lista de items */}
                    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                        {items.length === 0 && (
                            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
                                <ScanLine className="size-10 opacity-30" />
                                <p className="text-sm">Buscá o escaneá un artículo para comenzar</p>
                            </div>
                        )}
                        {items.map((item, index) => {
                            const product = products.find((p) => p.id.toString() === item.product_id);
                            const img = product?.images?.find((i) => i.is_primary) || product?.images?.[0];
                            const stocks = stockByProduct[item.product_id] ?? [];
                            const selectedStock = stocks.find((s) => String(s.warehouse_id) === item.warehouse_id);
                            const stockHere = selectedStock?.quantity ?? 0;
                            const insufficient = !!item.product_id && item.quantity > stockHere;
                            const otherStock = stocks.filter((s) => String(s.warehouse_id) !== item.warehouse_id && s.quantity >= item.quantity);
                            const lineError = errors[`items.${index}.price` as keyof typeof errors] || errors[`items.${index}.quantity` as keyof typeof errors] || errors[`items.${index}.product_id` as keyof typeof errors];

                            return (
                                <div key={index} className="group rounded-xl border bg-card p-3 transition-colors hover:border-primary/20">
                                    <div className="flex items-center gap-3">
                                        {img ? (
                                            <img src={`/storage/${img.path}`} alt={product?.name} className="size-12 shrink-0 rounded-lg object-cover" />
                                        ) : (
                                            <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-lg">
                                                <Package className="text-muted-foreground size-5" />
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            {product ? (
                                                <>
                                                    <p className="truncate text-sm font-semibold">{product.name}</p>
                                                    <p className="text-muted-foreground text-xs">{product.sku}</p>
                                                </>
                                            ) : (
                                                <Select value={item.product_id} onValueChange={(v) => selectProductForLine(index, v)}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Seleccionar artículo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map((p) => (
                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                {p.sku} - {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                        {/* Cantidad */}
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 rounded-full"
                                                onClick={() => item.quantity > 1 && updateItem(index, { quantity: item.quantity - 1 })}
                                            >
                                                <Minus className="size-3.5" />
                                            </Button>
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                                min={1}
                                                className="h-7 w-10 border-0 bg-transparent p-0 text-center text-sm font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 rounded-full"
                                                onClick={() => updateItem(index, { quantity: item.quantity + 1 })}
                                            >
                                                <Plus className="size-3.5" />
                                            </Button>
                                        </div>

                                        {/* Precio */}
                                        <div className="w-28">
                                            <MoneyInput
                                                value={item.price}
                                                onValueChange={(v) => updateItem(index, { price: v })}
                                                className="h-7"
                                            />
                                            {item.quantity > 1 && (
                                                <p className="text-muted-foreground mt-0.5 text-right text-[10px] tabular-nums">Sub: {fmt(item.quantity * item.price)}</p>
                                            )}
                                        </div>

                                        {/* Borrar */}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
                                            onClick={() => removeItem(index)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>

                                    {lineError && <p className="mt-1 text-xs text-destructive">{lineError}</p>}

                                    {/* Almacén + stock */}
                                    {item.product_id && warehouses.length > 0 && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                                            <WarehouseIcon className="text-muted-foreground size-3.5" />
                                            <Select value={item.warehouse_id} onValueChange={(v) => updateItem(index, { warehouse_id: v })}>
                                                <SelectTrigger className="h-7 w-auto min-w-[160px] text-xs">
                                                    <SelectValue placeholder="Almacén" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {warehouses.map((w) => {
                                                        const s = stocks.find((st) => st.warehouse_id === w.id);
                                                        return (
                                                            <SelectItem key={w.id} value={String(w.id)}>
                                                                {w.name} {s ? `(${s.quantity})` : '(0)'}
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
                                                            onClick={() => updateItem(index, { warehouse_id: String(s.warehouse_id) })}
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

                {/* RIGHT PANEL — Resumen (sticky) */}
                <div className="flex w-full flex-col border-t bg-card lg:w-[380px] lg:border-l lg:border-t-0">
                    <div className="border-b p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold tracking-tight">Resumen</h2>
                            <div className="flex items-center gap-2">
                                {data.customer_id && <Badge variant="info">Factura {voucherLetter}</Badge>}
                                <Badge variant="secondary" className="tabular-nums">
                                    {items.length} {items.length === 1 ? 'item' : 'items'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-5 overflow-y-auto p-5">
                        {/* Totales */}
                        <div className="space-y-2.5">
                            <div className="text-muted-foreground flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span className="tabular-nums">{fmt(subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <Label className="text-muted-foreground text-sm font-normal">Recargo</Label>
                                <div className="w-28">
                                    <MoneyInput value={Number(data.surcharge)} onValueChange={(v) => setData('surcharge', v)} className="h-8" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <Label className="text-muted-foreground text-sm font-normal">Descuento</Label>
                                <div className="w-28">
                                    <MoneyInput value={Number(data.additional_discount)} onValueChange={(v) => setData('additional_discount', v)} className="h-8" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t pt-3">
                                <span className="text-base font-semibold">Total</span>
                                <span className="text-primary text-2xl font-bold tabular-nums">{fmt(total)}</span>
                            </div>
                        </div>

                        {/* Pago */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold">Pago</h3>
                            <FormField label="Método de pago" error={errors.payment_method}>
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
                            </FormField>

                            {!data.auto_payment && (
                                <FormField label="Monto del pago" error={errors.payment_amount}>
                                    <MoneyInput
                                        value={Number(data.payment_amount)}
                                        onValueChange={(v) => setData('payment_amount', v)}
                                        error={errors.payment_amount}
                                    />
                                </FormField>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="auto_payment"
                                        checked={data.auto_payment}
                                        onCheckedChange={(checked) => {
                                            const val = !!checked;
                                            setData('auto_payment', val);
                                            if (val) setData('payment_amount', total);
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

                            {partialPayment && (
                                <div className="rounded-lg bg-warning-soft p-3">
                                    <p className="text-warning text-xs font-medium">Pago parcial — Saldo pendiente: {fmt(total - data.payment_amount)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="grid grid-cols-2 gap-2 border-t p-4">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            <X className="size-4" />
                            Cancelar
                        </Button>
                        <Button type="button" variant="secondary" onClick={addEmptyItem}>
                            <Plus className="size-4" />
                            Línea
                        </Button>
                        <Button type="submit" disabled={!canSubmit} className="col-span-2" size="lg">
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
