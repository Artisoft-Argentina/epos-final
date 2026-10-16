import { FormField } from '@/components/form-field';
import QRScanner from '@/components/QRScanner';
import { ProductCard, type CatalogProduct, type CatalogView } from '@/components/sales/product-card';
import { SaleLine, type SaleItem, type WarehouseStock } from '@/components/sales/sale-line';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Camera,
    ChevronDown,
    ChevronUp,
    LayoutGrid,
    List,
    ListOrdered,
    Package,
    Pencil,
    Plus,
    ScanLine,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Customer {
    id: number;
    business_name: string;
    fantasy_name?: string | null;
    tax_status?: string | null;
    credit?: number | string | null;
}

interface Product extends CatalogProduct {
    // Códigos alternativos: el mostrador busca por cualquiera de ellos, igual
    // que el lector de código de barras.
    barcode?: string | null;
    ean?: string | null;
    qr_code?: string | null;
    supplier_code?: string | null;
    brand?: { id: number; name: string } | null;
    price_lists: { id: number; pivot: { price: number } }[];
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
    warehouse?: { id: number; name: string } | null;
    next_invoice_number_a?: number | null;
    next_invoice_number_b?: number | null;
}

interface Warehouse {
    id: number;
    name: string;
    is_default: boolean;
}

interface Props {
    customers: Customer[];
    products: Product[];
    priceLists: PriceList[];
    defaultPosList: PriceList | null;
    pointsOfSale?: PointOfSale[];
    warehouses?: Warehouse[];
    /** Stock del almacén del punto de venta, por id de artículo. */
    posStock?: Record<string, number>;
    /** Saldo pendiente por id de cliente. Sólo vienen los que deben algo. */
    customerBalances?: Record<string, number>;
    paymentMethods?: Record<string, string>;
}

interface PageProps {
    activePointOfSaleId: number | null;
    [key: string]: unknown;
}

const fmt = (n: number): string => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Tope de artículos dibujados a la vez. En lista entran más porque cada fila
 * ocupa mucho menos alto. Más que esto no se lee: se refina la búsqueda.
 */
const CATALOG_CAP: Record<CatalogView, number> = { grid: 40, list: 60 };

const VIEW_STORAGE_KEY = 'pos.catalog-view';
const SUMMARY_STORAGE_KEY = 'pos.summary-folded';

/**
 * Condición frente al IVA escrita como la lee un vendedor. Algunos tenants la
 * guardan con el nombre completo y otros con el código de ARCA; el chip tiene
 * que decir lo mismo en los dos casos.
 */
const TAX_STATUS_LABELS: Record<string, string> = {
    RI: 'Responsable Inscripto',
    MO: 'Monotributo',
    EX: 'Exento',
    CF: 'Consumidor Final',
};

function taxStatusLabel(taxStatus: string): string {
    return TAX_STATUS_LABELS[taxStatus.trim().toUpperCase()] ?? taxStatus;
}

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

/** Porcentaje entre 0 y 100, tolerante al input a medio tipear. */
function parsePercent(text: string): number {
    const n = parseFloat(text);
    if (isNaN(n)) return 0;
    return Math.min(Math.max(n, 0), 100);
}

/** Atajo de teclado visible, como el que la propuesta muestra junto a F2 y F3. */
function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[0.7rem] font-medium text-muted-foreground sm:inline-block">
            {children}
        </kbd>
    );
}

/** Campo de porcentaje chico, para recargo y descuento sobre el subtotal. */
function PercentInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
    return (
        <div className="relative w-[76px]">
            <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={label}
                className="h-8 [appearance:textfield] pr-6 text-right text-sm tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
        </div>
    );
}

export default function Create({
    customers,
    products,
    priceLists,
    defaultPosList,
    pointsOfSale = [],
    warehouses = [],
    posStock = {},
    customerBalances = {},
    paymentMethods = {},
}: Props) {
    const page = usePage<PageProps>();
    const { can } = usePermission();
    const activePosId = page.props.activePointOfSaleId;
    const activePos = pointsOfSale.find((p) => p.id === activePosId) ?? pointsOfSale[0];
    const defaultWarehouseId = activePos?.warehouse_id ?? warehouses.find((w) => w.is_default)?.id ?? warehouses[0]?.id ?? null;
    const posWarehouseName = activePos?.warehouse?.name ?? warehouses.find((w) => w.id === defaultWarehouseId)?.name ?? null;

    const [stockByProduct, setStockByProduct] = useState<Record<string, WarehouseStock[]>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryId, setCategoryId] = useState('all');
    const [highlight, setHighlight] = useState(0);
    // El resaltado sólo vale cuando el usuario está eligiendo: buscando o
    // moviéndose con las flechas. Sin esto, el catálogo arranca con el primer
    // artículo marcado y un Enter distraído lo agregaría sin que nadie lo pida.
    const [picking, setPicking] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    // El encabezado arranca abierto —hay que elegir cliente— y se pliega solo en
    // cuanto está completo. `editingHeader` es el volver a abrirlo a propósito.
    const [editingHeader, setEditingHeader] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    /*
     * Alto disponible para el POS, medido en vez de calculado.
     * Antes era `100vh - 4rem`, pero el encabezado de la app mide 72px y no 64:
     * el panel se pasaba y la página entera scrolleaba además del comprobante.
     * `SidebarInset` usa `min-h-svh`, que es un mínimo y no acota a los hijos,
     * así que `flex-1` tampoco alcanza. Se mide dónde arranca el formulario y se
     * ocupa lo que queda; sólo lo usa el layout de dos columnas (xl).
     */
    const shellRef = useRef<HTMLFormElement>(null);
    const [shellHeight, setShellHeight] = useState<string>();

    useEffect(() => {
        const measure = () => {
            const el = shellRef.current;
            if (!el) return;

            const top = el.getBoundingClientRect().top + window.scrollY;
            // El contenedor del layout lleva margen (`m-2` en la variante inset):
            // sin descontarlo sobran unos píxeles y la página scrollea igual.
            const inset = el.closest('[data-slot="sidebar-inset"]');
            const gap = inset ? parseFloat(getComputedStyle(inset).marginBottom) || 0 : 0;

            setShellHeight(`${Math.max(320, window.innerHeight - top - gap)}px`);
        };

        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    // La vista elegida se recuerda: volver siempre al valor por defecto molesta
    // más de lo que ayuda. Puede fallar en modo privado, de ahí el try/catch.
    const [view, setView] = useState<CatalogView>(() => {
        if (typeof window === 'undefined') return 'grid';
        try {
            const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
            return saved === 'list' || saved === 'grid' ? saved : 'grid';
        } catch {
            return 'grid';
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(VIEW_STORAGE_KEY, view);
        } catch {
            /* sin persistencia: la vista vale sólo para esta sesión */
        }
    }, [view]);

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

    /*
     * Recargo y descuento se expresan en porcentaje del subtotal, que es cómo
     * se pactan en el mostrador ("te hago un 5%"). Al backend sigue viajando el
     * importe, que es lo que la factura declara: el porcentaje es sólo la forma
     * de escribirlo.
     */
    const [surchargePct, setSurchargePct] = useState('0');
    const [discountPct, setDiscountPct] = useState('0');
    const [showAdjustments, setShowAdjustments] = useState(false);

    // Al cerrar se normaliza el texto de los dos campos: pueden haber quedado
    // en '' o '0.00' de tipear, y la próxima vez que se abran tienen que
    // mostrar un 0 limpio.
    const closeAdjustments = () => {
        setSurchargePct('0');
        setDiscountPct('0');
        setShowAdjustments(false);
    };

    /*
     * Plegado del bloque de cobro. Es el único plegado manual de la pantalla
     * —el encabezado y los ajustes se manejan solos— y por eso se recuerda:
     * el vendedor lo acomoda una vez a su monitor, no en cada venta.
     */
    const [summaryFolded, setSummaryFolded] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        try {
            return window.localStorage.getItem(SUMMARY_STORAGE_KEY) === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(SUMMARY_STORAGE_KEY, summaryFolded ? '1' : '0');
        } catch {
            /* sin persistencia: el plegado vale sólo para esta sesión */
        }
    }, [summaryFolded]);

    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.price, 0), [items]);

    const surchargeAmount = round2((subtotal * parsePercent(surchargePct)) / 100);
    const discountAmount = round2((subtotal * parsePercent(discountPct)) / 100);
    const total = round2(subtotal + surchargeAmount - discountAmount);

    // Se abre al tocarlo, y también solo si la venta ya trae un ajuste cargado.
    const adjustmentsOpen = showAdjustments || surchargeAmount > 0 || discountAmount > 0;

    useEffect(() => {
        setData((prev) => ({ ...prev, surcharge: surchargeAmount, additional_discount: discountAmount }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [surchargeAmount, discountAmount]);

    // Fuente única de verdad: si el pago es automático, sigue al total.
    useEffect(() => {
        if (data.auto_payment) {
            setData('payment_amount', total);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [total, data.auto_payment]);

    /*
     * "Paga con" es lo que el cliente entrega, que no es lo mismo que lo que se
     * registra como pago: con $30.000 por una venta de $26.505 el pago sigue
     * siendo $26.505 y los $3.495 son vuelto. El backend rechaza un pago mayor
     * al total, así que el excedente nunca se envía.
     *
     * Con el pago automático destildado el campo pasa a ser el pago real y lo
     * que falte queda como saldo pendiente: así siguen existiendo los pagos
     * parciales.
     */
    const [tendered, setTendered] = useState(0);

    useEffect(() => {
        if (data.auto_payment) setTendered(total);
    }, [total, data.auto_payment]);

    const tenderedValue = data.auto_payment ? tendered : Number(data.payment_amount);
    const setTenderedValue = (value: number) => {
        if (data.auto_payment) setTendered(value);
        else setData('payment_amount', value);
    };

    const change = data.auto_payment ? Math.max(0, round2(tendered - total)) : 0;

    // Códigos por los que se puede identificar un artículo, en el mismo orden
    // que usa CodigoService para el lector.
    const codesOf = (p: Product): string[] =>
        [p.sku, p.barcode, p.ean, p.qr_code, p.supplier_code].filter(Boolean).map((c) => String(c).toLowerCase());

    const categories = useMemo(() => {
        const found = new Map<number, string>();
        products.forEach((p) => {
            if (p.category) found.set(p.category.id, p.category.name);
        });
        return [...found.entries()].map(([id, name]) => ({ id: String(id), name })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }, [products]);

    /** Catálogo filtrado por categoría y por término de búsqueda. */
    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        let list = products;

        if (categoryId !== 'all') {
            list = list.filter((p) => String(p.category?.id) === categoryId);
        }
        if (term) {
            list = list.filter((p) => p.name.toLowerCase().includes(term) || codesOf(p).some((code) => code.includes(term)));
        }
        return list;
    }, [products, searchTerm, categoryId]);

    const visible = filtered.slice(0, CATALOG_CAP[view]);

    /**
     * Stock que se muestra en la ficha: el del almacén del punto de venta, que
     * es el único que esta venta puede comprometer sin pedir una transferencia.
     * Un artículo sin registro de stock en ese almacén tiene cero, no "sin dato".
     */
    const stockOf = (product: Product): number => posStock[String(product.id)] ?? 0;

    /**
     * Código tipeado o escaneado que identifica un artículo sin ambigüedad.
     * Se busca sobre el catálogo completo a propósito: escanear tiene que
     * funcionar aunque haya una categoría filtrada.
     */
    const exactCodeMatch = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return undefined;

        return products.find((p) => codesOf(p).includes(term));
    }, [searchTerm, products]);

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
        setData('items', [...items, { product_id: '', quantity: 1, price: 0, warehouse_id: defaultWarehouseId ? String(defaultWarehouseId) : '' }]);
    };

    const removeItem = (index: number) => {
        setData(
            'items',
            items.filter((_, i) => i !== index),
        );
    };

    const updateItem = (index: number, patch: Partial<SaleItem>) => {
        setData(
            'items',
            items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        );
    };

    const selectProductForLine = (index: number, productId: string) => {
        const product = products.find((p) => p.id.toString() === productId);
        updateItem(index, { product_id: productId, price: product ? priceForProduct(product) : 0 });
        if (product) fetchStockForProduct(productId);
    };

    const addProduct = (product: Product) => {
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
        setHighlight(0);
        setPicking(false);
        searchInputRef.current?.focus();
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setHighlight(0);
        setPicking(value.trim().length > 0);
    };

    /**
     * Teclado del mostrador. Los lectores de código de barras se comportan como
     * un teclado: escriben el código y mandan Enter. Por eso un match exacto de
     * código se agrega directo, sin obligar a elegir de la lista.
     */
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            setSearchTerm('');
            setHighlight(0);
            setPicking(false);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setPicking(true);
            setHighlight((i) => (picking ? Math.min(i + 1, visible.length - 1) : 0));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setPicking(true);
            setHighlight((i) => Math.max(i - 1, 0));
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            // Sin término ni navegación por flechas no hay nada elegido: un Enter
            // suelto no debe agregar el primer artículo del catálogo.
            const product = exactCodeMatch ?? (picking ? visible[highlight] : undefined);
            if (product) addProduct(product);
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
                    if (found) addProduct(found);
                }
            }
        } catch (error) {
            console.error('Error al buscar artículo:', error);
        }
    };

    const selectedCustomer = customers.find((c) => c.id.toString() === data.customer_id);
    const voucherLetter = resolveVoucherLetter(selectedCustomer?.tax_status);
    const customerBalance = selectedCustomer ? Number(customerBalances[String(selectedCustomer.id)] ?? 0) : 0;
    const customerCredit = selectedCustomer ? Number(selectedCustomer.credit ?? 0) : 0;

    /*
     * Próximo número de comprobante del punto de venta. Sale del mismo registro
     * que después consume InvoiceNumberService, así que no cuesta una consulta
     * extra. Es el número esperado, no uno reservado: si otra caja factura
     * primero, el definitivo será el siguiente. Si el contador no está
     * inicializado no se muestra un número inventado.
     */
    const nextVoucherNumber = useMemo(() => {
        if (!activePos) return null;
        const counter = voucherLetter === 'A' ? activePos.next_invoice_number_a : activePos.next_invoice_number_b;
        if (!counter || counter < 1) return null;

        return `${voucherLetter} ${String(activePos.pos_number).padStart(4, '0')}-${String(counter).padStart(8, '0')}`;
    }, [activePos, voucherLetter]);

    const headerCollapsed = !!selectedCustomer && !!data.price_list_id && !editingHeader;

    const hasEmptyLine = items.some((item) => !item.product_id);
    const pendingBalance = data.auto_payment ? 0 : Math.max(0, round2(total - Number(data.payment_amount)));

    /*
     * Plegar puede ahorrar espacio, nunca esconder una decisión: si hay vuelto,
     * saldo pendiente, un ajuste cargado o un error de pago, el bloque se abre
     * aunque el vendedor lo haya dejado plegado.
     */
    // Lo que bloquea el plegado es que haya un ajuste *cargado*, no que el panel
    // de ajustes esté abierto: abrirlo y no poner nada no es una decisión que
    // haya que proteger, y antes dejaba el chevron del resumen inutilizable.
    const hasAdjustment = surchargeAmount > 0 || discountAmount > 0;
    const paymentNeedsAttention = change > 0 || pendingBalance > 0 || hasAdjustment || !!errors.payment_amount || !!errors.payment_method;
    const summaryCollapsed = summaryFolded && !paymentNeedsAttention;

    /**
     * Lo que el pie plegado sigue diciendo. Son los tres valores que, de otro
     * modo, quedarían invisibles: con qué se cobra, por cuánto y si la mercadería
     * sale ahora. El que se desvía del valor por defecto cambia de variante —no
     * de forma—, así la excepción se enciende sin que las otras dos se muevan.
     */
    const paymentSummary: { label: string; variant: 'outline' | 'warning' }[] = [
        { label: paymentMethods[data.payment_method] ?? data.payment_method, variant: 'outline' },
        pendingBalance > 0 ? { label: 'Pago parcial', variant: 'warning' as const } : { label: 'Pago por el total', variant: 'outline' as const },
        data.auto_delivery
            ? { label: 'Entrega inmediata', variant: 'outline' as const }
            : { label: 'Entrega pendiente', variant: 'warning' as const },
    ];
    const itemErrorKeys = Object.keys(errors).filter((k) => k.startsWith('items'));
    const unitCount = items.reduce((sum, item) => sum + item.quantity, 0);
    // Sin lista de precios no hay precio de línea: la venta no se puede facturar.
    const canSubmit =
        !processing && !!data.customer_id && !!data.price_list_id && items.length > 0 && !hasEmptyLine && Number(data.payment_amount) <= total;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sales.store'));
    };

    // Atajos del mostrador: F3 vuelve al buscador sin soltar el teclado y F2
    // cobra. Son los mismos que anuncia la pantalla junto a cada control.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F3') {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
                return;
            }
            if (e.key === 'F2') {
                e.preventDefault();
                if (canSubmit) shellRef.current?.requestSubmit();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [canSubmit]);

    // Sin ninguna lista configurada el POS no es operable: todos los artículos
    // saldrían a $0. Se bloquea la venta y se ofrece el camino para resolverlo.
    if (priceLists.length === 0) {
        return (
            <AppLayout>
                <Head title="Nueva Venta" />

                <div className="flex flex-1 items-center justify-center p-6">
                    <Card className="w-full max-w-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ListOrdered className="size-4 text-muted-foreground" />
                                Nueva Venta
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <Alert variant="warning">
                                <AlertTriangle className="size-4" />
                                <AlertTitle>No hay listas de precios configuradas</AlertTitle>
                                <AlertDescription>
                                    El precio de cada artículo sale de una lista de precios. Hasta que exista al menos una, no se pueden registrar
                                    ventas.
                                </AlertDescription>
                            </Alert>

                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    <X className="size-4" />
                                    Volver
                                </Button>
                                {can('price-lists.store') ? (
                                    <Link href={route('price-lists.index')}>
                                        <Button>
                                            <Plus className="size-4" />
                                            Crear lista de precios
                                        </Button>
                                    </Link>
                                ) : (
                                    <p className="self-center text-sm text-muted-foreground">
                                        Pedile a un administrador que configure una lista de precios.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Nueva Venta" />

            {/*
              El recorte vale sólo desde xl. En pantallas chicas las dos regiones
              se apilan y la página scrollea: con overflow oculto, el buscador y
              el catálogo quedaban recortados y no se podía vender desde un
              teléfono.
            */}
            <form
                ref={shellRef}
                onSubmit={submit}
                style={{ '--pos-shell-h': shellHeight } as React.CSSProperties}
                className="flex flex-col xl:h-[var(--pos-shell-h)] xl:flex-row xl:overflow-hidden"
            >
                {/* ───── CATÁLOGO ───── */}
                <section className="flex flex-1 flex-col gap-3 p-4 md:p-6 xl:overflow-hidden">
                    {/* Barra de contexto: desde qué caja y contra qué almacén se vende. */}
                    {activePos && (
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                            <span>
                                Punto de venta{' '}
                                <b className="font-semibold text-foreground tabular-nums">{String(activePos.pos_number).padStart(4, '0')}</b>
                            </span>
                            {posWarehouseName && (
                                <span>
                                    Almacén <b className="font-semibold text-foreground">{posWarehouseName}</b>
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Input
                                ref={searchInputRef}
                                type="text"
                                startIcon={<Search className="size-4" />}
                                placeholder={products.length === 0 ? 'No hay artículos para vender' : 'Buscar por nombre, SKU o código de barras...'}
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                disabled={products.length === 0}
                                className="pr-12"
                            />
                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                                <Kbd>F3</Kbd>
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
                                <Button
                                    type="button"
                                    variant={view === 'grid' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className="size-8"
                                    onClick={() => setView('grid')}
                                    title="Ver en grilla"
                                    aria-pressed={view === 'grid'}
                                >
                                    <LayoutGrid className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant={view === 'list' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className="size-8"
                                    onClick={() => setView('list')}
                                    title="Ver en lista"
                                    aria-pressed={view === 'list'}
                                >
                                    <List className="size-4" />
                                </Button>
                            </div>

                            <Button type="button" variant="outline" size="icon" onClick={() => setIsScanning(true)} title="Escanear QR">
                                <Camera className="size-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" onClick={addEmptyItem} title="Agregar línea manual">
                                <Plus className="size-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Filtros de categoría: fichas, no botones, para que no compitan
                        con el botón de agregar de cada artículo. */}
                    {categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {[{ id: 'all', name: 'Todos' }, ...categories].map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCategoryId(c.id)}
                                    aria-pressed={categoryId === c.id}
                                    className={cn(
                                        'rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
                                        categoryId === c.id
                                            ? 'border-transparent bg-primary/10 text-primary'
                                            : 'border-border text-foreground hover:bg-accent',
                                    )}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="xl:flex-1 xl:overflow-y-auto xl:pr-1">
                        {products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                <Package className="size-10 text-muted-foreground opacity-30" />
                                <div>
                                    <p className="text-sm font-medium">No hay artículos para vender</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        El catálogo está vacío o todos los artículos están dados de baja.
                                    </p>
                                </div>
                                {can('products.create') && (
                                    <Link href={route('products.create')}>
                                        <Button variant="outline" size="sm">
                                            <Plus className="size-4" />
                                            Crear artículo
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : visible.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                                <ScanLine className="size-10 opacity-30" />
                                <p className="text-sm">
                                    {searchTerm.trim() ? `Ningún artículo coincide con «${searchTerm}».` : 'No hay artículos en esta categoría.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div
                                    className={
                                        view === 'grid'
                                            ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-3 2xl:grid-cols-4'
                                            : 'flex flex-col gap-1.5'
                                    }
                                >
                                    {visible.map((product, index) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            price={priceForProduct(product)}
                                            view={view}
                                            highlighted={picking && index === highlight}
                                            stock={stockOf(product)}
                                            onAdd={() => addProduct(product)}
                                            onHover={() => {
                                                setHighlight(index);
                                                setPicking(true);
                                            }}
                                        />
                                    ))}
                                </div>

                                <p className="mt-3 text-xs text-muted-foreground">
                                    {filtered.length > visible.length
                                        ? `Mostrando ${visible.length} de ${filtered.length} — refiná la búsqueda`
                                        : `${filtered.length} ${filtered.length === 1 ? 'artículo' : 'artículos'}`}
                                    <span className="hidden sm:inline"> · ↑↓ para elegir · Enter para agregar</span>
                                </p>
                            </>
                        )}
                    </div>
                </section>

                {/* ───── COMPROBANTE ───── */}
                {/* 420px y no 400: los 20px salen del catálogo, que no los necesita,
                    y se los lleva la columna del nombre del artículo, que a 400
                    cortaba en 20 caracteres. */}
                <aside className="flex w-full flex-col border-t bg-card xl:w-[420px] xl:overflow-hidden xl:border-t-0 xl:border-l">
                    {headerCollapsed ? (
                        /*
                          Una vez elegidos, el cliente y la lista no se vuelven a
                          tocar en toda la venta: ocupan 236px fijos de un panel de
                          865 para no decir nada nuevo. Plegado dice lo mismo en 80
                          y le devuelve ese espacio al carrito, que es lo que el
                          vendedor sí mira todo el tiempo. Se toca para corregir.
                        */
                        <button
                            type="button"
                            onClick={() => setEditingHeader(true)}
                            title="Cambiar el cliente o la lista de precios"
                            className="flex shrink-0 flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-accent"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-base font-semibold tabular-nums">{nextVoucherNumber ?? 'Comprobante'}</span>
                                <Badge variant="info">Factura {voucherLetter}</Badge>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-medium">
                                    {selectedCustomer?.fantasy_name || selectedCustomer?.business_name}
                                </span>
                                <span className="shrink-0 truncate text-xs text-muted-foreground">
                                    · {priceLists.find((l) => l.id.toString() === data.price_list_id)?.name}
                                </span>
                                <Pencil className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                            </div>

                            {/*
                              Plegado no se repite la condición IVA: la letra del
                              comprobante ya la dice. Quedan saldo y crédito, que
                              son los dos datos sobre los que hay que decidir algo.
                            */}
                            {(customerBalance > 0 || customerCredit > 0) && (
                                <div className="flex flex-wrap gap-1.5">
                                    {customerBalance > 0 && (
                                        <Badge variant="warning" className="tabular-nums">
                                            Saldo {fmt(customerBalance)}
                                        </Badge>
                                    )}
                                    {customerCredit > 0 && (
                                        <Badge variant="success" className="tabular-nums">
                                            Crédito {fmt(customerCredit)}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </button>
                    ) : (
                        <div className="flex shrink-0 flex-col gap-2.5 border-b px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-base font-semibold tabular-nums">{nextVoucherNumber ?? 'Comprobante'}</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="info">Factura {voucherLetter}</Badge>
                                    {/*
                                      Salida del modo edición. Antes el encabezado sólo se
                                      plegaba al elegir un cliente, así que abrirlo para
                                      mirar —o para tocar sólo la lista de precios— dejaba
                                      al vendedor obligado a reelegir cliente para recuperar
                                      el alto del carrito.

                                      Dice "Ocultar" y no "Confirmar" ni "Guardar" porque no
                                      hay nada que confirmar ni guardar: cada cambio ya está
                                      aplicado. Tampoco "Cerrar", que en un POS se lee como
                                      cerrar la venta o la caja.
                                    */}
                                    {selectedCustomer && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-xs"
                                            onClick={() => setEditingHeader(false)}
                                            title="Ocultar el cliente y la lista de precios"
                                        >
                                            <ChevronUp className="size-3.5" />
                                            Ocultar
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <FormField label="Cliente" required error={errors.customer_id}>
                                <Combobox
                                    options={customers.map((c) => ({
                                        value: c.id.toString(),
                                        label: c.fantasy_name || c.business_name,
                                    }))}
                                    value={data.customer_id}
                                    onValueChange={(value) => {
                                        setData('customer_id', value);
                                        // Elegir cliente es el último paso del encabezado:
                                        // se cierra solo y devuelve el alto al carrito.
                                        setEditingHeader(false);
                                    }}
                                    placeholder="Seleccionar"
                                    searchPlaceholder="Buscar cliente..."
                                    emptyMessage="No se encontraron clientes."
                                    error={errors.customer_id}
                                />
                            </FormField>

                            {/* Condición IVA, saldo y crédito: lo que hace falta saber del
                            cliente antes de facturarle, sin salir de la pantalla. */}
                            {selectedCustomer && (
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedCustomer.tax_status && <Badge variant="secondary">{taxStatusLabel(selectedCustomer.tax_status)}</Badge>}
                                    {customerBalance > 0 && (
                                        <Badge variant="warning" className="tabular-nums">
                                            Saldo {fmt(customerBalance)}
                                        </Badge>
                                    )}
                                    {customerCredit > 0 && (
                                        <Badge variant="success" className="tabular-nums">
                                            Crédito {fmt(customerCredit)}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            <FormField label="Lista de precios" required error={errors.price_list_id}>
                                <Select value={data.price_list_id} onValueChange={changePriceList}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
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
                    )}

                    {/* `min-h-0` es lo que permite que un hijo flex scrollee en lugar de
                        empujar al contenedor; el mínimo en píxeles evita que en una
                        pantalla baja los renglones se aplasten hasta desaparecer. */}
                    <div className="px-4 xl:min-h-[88px] xl:flex-1 xl:overflow-y-auto">
                        {itemErrorKeys.length > 0 && (
                            <Alert variant="destructive" className="mt-3">
                                <AlertTriangle className="size-4" />
                                <AlertDescription>Revisá los artículos: hay líneas con datos inválidos.</AlertDescription>
                            </Alert>
                        )}

                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                                <ScanLine className="size-8 opacity-30" />
                                <p className="text-sm">Elegí un artículo del catálogo para comenzar</p>
                            </div>
                        ) : (
                            items.map((item, index) => (
                                <SaleLine
                                    key={index}
                                    item={item}
                                    product={products.find((p) => p.id.toString() === item.product_id)}
                                    products={products}
                                    warehouses={warehouses}
                                    stocks={stockByProduct[item.product_id] ?? []}
                                    error={
                                        (errors[`items.${index}.price` as keyof typeof errors] ||
                                            errors[`items.${index}.quantity` as keyof typeof errors] ||
                                            errors[`items.${index}.product_id` as keyof typeof errors]) as string | undefined
                                    }
                                    onChange={(patch) => updateItem(index, patch)}
                                    onSelectProduct={(productId) => selectProductForLine(index, productId)}
                                    onRemove={() => removeItem(index)}
                                />
                            ))
                        )}
                    </div>

                    {/*
                      Pie fijo. Totales, recargo, descuento, cobro y los dos
                      interruptores quedan anclados: en una venta de veinte ítems
                      el total y el botón de cobrar siguen a la vista y sólo
                      scrollean los renglones.

                      En una pantalla alta el pie entra entero y nada de esto
                      scrollea. En una baja —1366×700, un portátil al 125%— el
                      pie no entra: son 419px de cobro contra 580 de panel, y
                      antes eso dejaba los renglones en cero y mandaba "Cobrar y
                      facturar" abajo del borde. Por eso el bloque de cobro puede
                      encogerse y scrollear por dentro, empezando por el total,
                      mientras los botones quedan siempre anclados.
                    */}
                    {/*
                      Fondo apenas hundido: el carrito corta un renglón al medio
                      justo contra este borde, y un filete de 0,67px en gris claro
                      no alcanza para que se lea dónde termina lo que scrollea y
                      empieza lo que está fijo.
                    */}
                    <div className="flex flex-col border-t bg-muted/40 xl:min-h-0 xl:shrink">
                        <div className="flex flex-col gap-3 px-4 pt-3 xl:min-h-0 xl:overflow-y-auto">
                            {/*
                              Sin ajustes, estas tres filas gastan 100px del panel
                              para decir que el subtotal es el total y que no hay
                              ni recargo ni descuento. Plegadas son una línea, y
                              esos 100px se los lleva el carrito. En cuanto hay un
                              porcentaje cargado se abren solas y ya no se cierran:
                              un ajuste que no se ve es un ajuste que se olvida.
                            */}
                            {summaryCollapsed ? null : adjustmentsOpen ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                                        {/* Mismo chevron que el del total: cierra el grupo.
                                            Con un ajuste cargado queda bloqueado, porque un
                                            recargo que no se ve es un recargo que se olvida. */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={closeAdjustments}
                                                disabled={hasAdjustment}
                                                title={
                                                    hasAdjustment ? 'Poné recargo y descuento en 0 para ocultarlos' : 'Ocultar recargo y descuento'
                                                }
                                                className="grid size-6 shrink-0 place-items-center rounded-md border bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                                            >
                                                <ChevronDown className="size-3.5" />
                                            </button>
                                            <span>Subtotal</span>
                                        </div>
                                        <span className="text-foreground tabular-nums">{fmt(subtotal)}</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2.5">
                                            <Label className="text-sm font-normal text-muted-foreground">Recargo</Label>
                                            <PercentInput value={surchargePct} onChange={setSurchargePct} label="Recargo en porcentaje" />
                                        </div>
                                        <span className="text-foreground tabular-nums">{fmt(surchargeAmount)}</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2.5">
                                            <Label className="text-sm font-normal text-muted-foreground">Descuento</Label>
                                            <PercentInput value={discountPct} onChange={setDiscountPct} label="Descuento en porcentaje" />
                                        </div>
                                        <span className="text-foreground tabular-nums">
                                            {discountAmount > 0 ? `−${fmt(discountAmount)}` : fmt(0)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustments(true)}
                                    className="self-start text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                                >
                                    Agregar recargo o descuento
                                </button>
                            )}

                            {/*
                              El total es el ancla del pie: lleva el control de
                              plegado al lado, pero nunca se pliega él. Es lo
                              último que se confirma antes de cobrarle a alguien,
                              y son 45 de los 219px del bloque: esconderlo no
                              resuelve el espacio y sí habilita cobrar a ciegas.
                            */}
                            <div className={cn('flex items-center justify-between gap-3', !summaryCollapsed && 'border-t pt-3')}>
                                <div className="flex min-w-0 items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSummaryFolded((folded) => !folded)}
                                        disabled={paymentNeedsAttention}
                                        aria-expanded={!summaryCollapsed}
                                        title={
                                            paymentNeedsAttention
                                                ? 'Esta venta tiene algo que resolver en el cobro'
                                                : summaryCollapsed
                                                  ? 'Mostrar las opciones de cobro'
                                                  : 'Ocultar las opciones de cobro y ver más artículos'
                                        }
                                        className="grid size-6 shrink-0 place-items-center rounded-md border bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                                    >
                                        {summaryCollapsed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                                    </button>
                                    <span className="text-base font-semibold">Total</span>
                                    {unitCount > 0 && (
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {unitCount} {unitCount === 1 ? 'unidad' : 'unidades'}
                                        </span>
                                    )}
                                </div>
                                <span className="text-2xl font-semibold tracking-tight text-primary tabular-nums">{fmt(total)}</span>
                            </div>

                            {/*
                              Plegado, estos tres badges son lo único que queda de
                              las opciones de cobro. Van en outline y no en gris
                              relleno porque el gris del badge y el fondo del pie
                              están a tres puntos: sobre esta superficie no se
                              leerían.
                            */}
                            {summaryCollapsed && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {paymentSummary.map((chip) => (
                                        <Badge key={chip.label} variant={chip.variant}>
                                            {chip.label}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {!summaryCollapsed && (
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label="Método" error={errors.payment_method}>
                                        <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(paymentMethods).map(([value, label]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>

                                    <FormField label="Paga con" error={errors.payment_amount}>
                                        <MoneyInput value={tenderedValue} onValueChange={setTenderedValue} error={errors.payment_amount} />
                                    </FormField>
                                </div>
                            )}

                            {change > 0 && (
                                <div className="flex items-center justify-between gap-3 rounded-md bg-success-soft px-3 py-2">
                                    <span className="text-sm font-medium text-success">Vuelto</span>
                                    <span className="text-base font-semibold text-success tabular-nums">{fmt(change)}</span>
                                </div>
                            )}

                            {pendingBalance > 0 && (
                                <div className="flex items-center justify-between gap-3 rounded-md bg-warning-soft px-3 py-2">
                                    <span className="text-sm font-medium text-warning">Saldo pendiente</span>
                                    <span className="text-base font-semibold text-warning tabular-nums">{fmt(pendingBalance)}</span>
                                </div>
                            )}

                            {!summaryCollapsed && (
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="auto_payment"
                                            checked={data.auto_payment}
                                            onCheckedChange={(checked) => {
                                                const val = !!checked;
                                                setData('auto_payment', val);
                                                setData('payment_amount', val ? total : 0);
                                            }}
                                        />
                                        <Label htmlFor="auto_payment" className="text-xs font-normal">
                                            Pago automático por el total
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="auto_delivery"
                                            checked={data.auto_delivery}
                                            onCheckedChange={(checked) => setData('auto_delivery', !!checked)}
                                        />
                                        <Label htmlFor="auto_delivery" className="text-xs font-normal">
                                            Entrega automática de productos
                                        </Label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex shrink-0 gap-2 px-4 py-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="shrink-0"
                                onClick={() => window.history.back()}
                                title="Cancelar la venta"
                            >
                                <X className="size-4" />
                            </Button>
                            <Button type="submit" size="lg" disabled={!canSubmit} className="flex-1">
                                {processing ? 'Procesando...' : 'Cobrar y facturar'}
                                {!processing && <Kbd>F2</Kbd>}
                            </Button>
                        </div>
                    </div>
                </aside>
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
