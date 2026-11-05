import type { CatalogView } from '@/components/sales/product-card';
import type { SaleItem, WarehouseStock } from '@/components/sales/sale-line';
import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface Customer {
    id: number;
    business_name: string;
    fantasy_name?: string | null;
    tax_status?: string | null;
    credit?: number | string | null;
}

export interface Product {
    id: number;
    name: string;
    sku: string;
    category?: { id: number; name: string } | null;
    images?: { id: number; path: string; is_primary: boolean }[];
    // Códigos alternativos: el mostrador busca por cualquiera de ellos, igual
    // que el lector de código de barras.
    barcode?: string | null;
    ean?: string | null;
    qr_code?: string | null;
    supplier_code?: string | null;
    brand?: { id: number; name: string } | null;
    price_lists: { id: number; pivot: { price: number } }[];
}

export interface PriceList {
    id: number;
    name: string;
    percentage: number;
    default_pos: boolean;
    default_ecommerce: boolean;
}

export interface PointOfSale {
    id: number;
    name: string;
    pos_number: number;
    warehouse_id: number;
    warehouse?: { id: number; name: string } | null;
    next_invoice_number_a?: number | null;
    next_invoice_number_b?: number | null;
}

export interface Warehouse {
    id: number;
    name: string;
    is_default: boolean;
}

export interface SaleFormProps {
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

export const fmt = (n: number): string => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Tope de artículos dibujados a la vez. En lista entran más porque cada fila
 * ocupa mucho menos alto. Más que esto no se lee: se refina la búsqueda.
 */
const CATALOG_CAP: Record<CatalogView, number> = { grid: 40, list: 60 };

/*
 * El escritorio y el teléfono guardan la vista del catálogo por separado. La
 * decisión es distinta en cada uno —en una pantalla grande la grilla se
 * aprovecha, en un teléfono entran cuatro fichas y la lista rinde más— y una
 * sola preferencia hacía que elegir lista en la compu dejara el teléfono en
 * lista también.
 */
const VIEW_STORAGE_KEY = 'pos.catalog-view';
const MOBILE_VIEW_STORAGE_KEY = 'pos.catalog-view.mobile';
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

export function taxStatusLabel(taxStatus: string): string {
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

/**
 * Vista del catálogo, recordada en `localStorage`. Volver al valor por defecto
 * en cada carga molesta más de lo que ayuda. Puede fallar en modo privado, de
 * ahí los try/catch.
 */
function useStoredView(key: string) {
    const [view, setView] = useState<CatalogView>(() => {
        if (typeof window === 'undefined') return 'grid';
        try {
            const saved = window.localStorage.getItem(key);
            return saved === 'list' || saved === 'grid' ? saved : 'grid';
        } catch {
            return 'grid';
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, view);
        } catch {
            /* sin persistencia: la vista vale sólo para esta sesión */
        }
    }, [key, view]);

    return [view, setView] as const;
}

/** Porcentaje entre 0 y 100, tolerante al input a medio tipear. */
function parsePercent(text: string): number {
    const n = parseFloat(text);
    if (isNaN(n)) return 0;
    return Math.min(Math.max(n, 0), 100);
}

/**
 * Todo el estado y las reglas de la pantalla de venta, sin una sola decisión de
 * layout. Lo consumen los dos shells —escritorio y teléfono—, que se reparten
 * sólo cómo se dibuja: el catálogo y el comprobante conviven en una pantalla
 * grande y se turnan en una chica, pero las reglas de qué se puede cobrar, qué
 * se pliega y qué se bloquea son las mismas.
 */
export function useSaleForm({
    customers,
    products,
    priceLists,
    defaultPosList,
    pointsOfSale = [],
    warehouses = [],
    posStock = {},
    customerBalances = {},
    paymentMethods = {},
}: SaleFormProps) {
    const page = usePage<PageProps>();
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

    const [view, setView] = useStoredView(VIEW_STORAGE_KEY);
    const [mobileView, setMobileView] = useStoredView(MOBILE_VIEW_STORAGE_KEY);

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

    const clearSearch = () => {
        setSearchTerm('');
        setHighlight(0);
        setPicking(false);
    };

    /**
     * Teclado del mostrador. Los lectores de código de barras se comportan como
     * un teclado: escriben el código y mandan Enter. Por eso un match exacto de
     * código se agrega directo, sin obligar a elegir de la lista.
     *
     * Recibe la lista visible porque cada shell la recorta distinto: el
     * escritorio según la vista elegida, el teléfono siempre en grilla.
     */
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, visible: Product[]) => {
        if (e.key === 'Escape') {
            clearSearch();
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
     *
     * Lo que bloquea el plegado es que haya un ajuste *cargado*, no que el panel
     * de ajustes esté abierto: abrirlo y no poner nada no es una decisión que
     * haya que proteger.
     */
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

    const submit = () => post(route('sales.store'));

    const errorFor = (index: number): string | undefined =>
        (errors[`items.${index}.price` as keyof typeof errors] ||
            errors[`items.${index}.quantity` as keyof typeof errors] ||
            errors[`items.${index}.product_id` as keyof typeof errors]) as string | undefined;

    return {
        // datos del servidor
        customers,
        products,
        priceLists,
        warehouses,
        paymentMethods,
        activePos,
        posWarehouseName,

        // formulario
        data,
        setData,
        errors,
        processing,
        submit,
        canSubmit,
        errorFor,
        itemErrorKeys,

        // catálogo
        searchTerm,
        handleSearch,
        clearSearch,
        handleSearchKeyDown,
        searchInputRef,
        categories,
        categoryId,
        setCategoryId,
        filtered,
        capacity: CATALOG_CAP,
        highlight,
        setHighlight,
        picking,
        setPicking,
        exactCodeMatch,
        view,
        setView,
        mobileView,
        setMobileView,
        stockOf,
        priceForProduct,

        // escáner
        isScanning,
        setIsScanning,
        handleScanResult,

        // renglones
        items,
        unitCount,
        stockByProduct,
        addProduct,
        addEmptyItem,
        removeItem,
        updateItem,
        selectProductForLine,

        // encabezado del comprobante
        selectedCustomer,
        voucherLetter,
        customerBalance,
        customerCredit,
        nextVoucherNumber,
        headerCollapsed,
        setEditingHeader,
        changePriceList,

        // totales y cobro
        subtotal,
        surchargeAmount,
        discountAmount,
        total,
        surchargePct,
        setSurchargePct,
        discountPct,
        setDiscountPct,
        adjustmentsOpen,
        setShowAdjustments,
        closeAdjustments,
        hasAdjustment,
        tenderedValue,
        setTenderedValue,
        change,
        pendingBalance,
        paymentSummary,
        paymentNeedsAttention,
        summaryCollapsed,
        setSummaryFolded,
    };
}

export type SaleForm = ReturnType<typeof useSaleForm>;
