import { FormField } from '@/components/form-field';
import { PercentInput } from '@/components/sales/pos-bits';
import { ProductCard } from '@/components/sales/product-card';
import { SaleLine } from '@/components/sales/sale-line';
import { fmt, taxStatusLabel, type SaleForm } from '@/components/sales/use-sale-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AlertTriangle, Camera, LayoutGrid, List, Package, Pencil, Plus, ScanLine, Search, X } from 'lucide-react';
import { useState } from 'react';

type Tab = 'catalogo' | 'venta';

/**
 * Shell de teléfono.
 *
 * A 390px el catálogo y el comprobante no entran juntos: apilados, el
 * comprobante arrancaba a 1573px de scroll y agregar un artículo no daba
 * ninguna señal de que algo hubiera pasado. Acá se turnan en dos pestañas, con
 * el contador de artículos en el propio conmutador —que es la señal que
 * faltaba— y una barra inferior fija que mantiene el total y el cobro a mano
 * desde las dos.
 *
 * El catálogo se puede ver en grilla o en lista, con preferencia propia —la del
 * escritorio no se toca—. La lista usa la fila `dense`, de dos renglones: la de
 * una línea deja 121px para el nombre a este ancho y corta casi todo.
 */
export function PosMobile({ sale }: { sale: SaleForm }) {
    const {
        products,
        priceLists,
        warehouses,
        paymentMethods,
        data,
        setData,
        errors,
        processing,
        submit,
        canSubmit,
        errorFor,
        itemErrorKeys,
        searchTerm,
        handleSearch,
        handleSearchKeyDown,
        searchInputRef,
        categories,
        categoryId,
        setCategoryId,
        filtered,
        capacity,
        mobileView,
        setMobileView,
        stockOf,
        priceForProduct,
        setIsScanning,
        items,
        unitCount,
        stockByProduct,
        addProduct,
        addEmptyItem,
        removeItem,
        updateItem,
        selectProductForLine,
        customers,
        selectedCustomer,
        voucherLetter,
        customerBalance,
        customerCredit,
        nextVoucherNumber,
        headerCollapsed,
        setEditingHeader,
        changePriceList,
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
    } = sale;

    const [tab, setTab] = useState<Tab>('catalogo');
    const [paying, setPaying] = useState(false);

    /**
     * Cobrar desde la barra inferior. Si todavía falta algo del comprobante
     * —típicamente el cliente— no abre la hoja de cobro: lleva a la pestaña de
     * la venta y abre el encabezado, que es donde está lo que falta.
     */
    const startPayment = () => {
        if (canSubmit) {
            setPaying(true);
            return;
        }
        setTab('venta');
        if (!selectedCustomer) setEditingHeader(true);
    };

    const visible = filtered.slice(0, capacity[mobileView]);

    /*
     * El contador va en unidades, no en renglones, por dos motivos. Uno es que
     * la barra de abajo ya muestra unidades y dos números distintos en la misma
     * pantalla obligan a preguntarse cuál es cuál. El otro es que agregar un
     * artículo que ya está cargado sube la cantidad del renglón en lugar de
     * sumar uno nuevo: contando renglones, tocar «+» sobre algo ya agregado no
     * movía el badge, que es justo lo único que avisa que la venta cambió.
     */
    const tabs: { id: Tab; label: string; count?: number }[] = [
        { id: 'catalogo', label: 'Catálogo' },
        { id: 'venta', label: 'Venta', count: unitCount },
    ];

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
            /* El relleno de abajo deja lugar a la barra fija, que si no tapa el
               último renglón del comprobante. */
            className="flex flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
        >
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex flex-col">
                {/* ───── CONMUTADOR ───── */}
                <div className="sticky top-0 z-20 flex flex-col gap-2.5 border-b bg-background px-4 py-2.5">
                    <TabsList className="w-full">
                        {tabs.map((t) => (
                            <TabsTrigger key={t.id} value={t.id} className="flex-1 gap-1.5">
                                {t.label}
                                {/* El contador es lo que avisa que un artículo entró al
                                comprobante sin tener que cambiar de pestaña. */}
                                {t.count !== undefined && t.count > 0 && (
                                    <Badge variant="default" className="tabular-nums">
                                        {t.count}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* El buscador queda fijo bajo el conmutador para no perder el
                    escaneo al scrollear el catálogo. */}
                    {tab === 'catalogo' && (
                        <div className="flex items-center gap-2">
                            <Input
                                ref={searchInputRef}
                                type="text"
                                startIcon={<Search className="size-4" />}
                                placeholder={products.length === 0 ? 'No hay artículos' : 'Nombre, SKU o código'}
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={(e) => handleSearchKeyDown(e, visible)}
                                disabled={products.length === 0}
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="icon" onClick={() => setIsScanning(true)} title="Escanear QR">
                                <Camera className="size-4" />
                            </Button>

                            {/* Grilla o lista, con su propia preferencia: en un teléfono
                            entran cuatro fichas por pantalla y la lista rinde el
                            triple, así que acá la elección pesa más que en la compu. */}
                            <div className="flex shrink-0 items-center gap-0.5 rounded-md bg-muted p-0.5">
                                <Button
                                    type="button"
                                    variant={mobileView === 'grid' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className="size-8"
                                    onClick={() => setMobileView('grid')}
                                    title="Ver en grilla"
                                    aria-pressed={mobileView === 'grid'}
                                >
                                    <LayoutGrid className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant={mobileView === 'list' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className="size-8"
                                    onClick={() => setMobileView('list')}
                                    title="Ver en lista"
                                    aria-pressed={mobileView === 'list'}
                                >
                                    <List className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ───── CATÁLOGO ───── */}
                <TabsContent value="catalogo" className="mt-0">
                    <section className="flex flex-col gap-3 p-4">
                        {categories.length > 0 && (
                            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5">
                                {[{ id: 'all', name: 'Todos' }, ...categories].map((c) => (
                                    /* Mismas clases que <Badge>, vía `badgeVariants`.
                                       `asChild` no sirve: está roto en el componente. */
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setCategoryId(c.id)}
                                        aria-pressed={categoryId === c.id}
                                        className={cn(
                                            badgeVariants({ variant: categoryId === c.id ? 'default' : 'outline' }),
                                            'shrink-0 cursor-pointer',
                                            categoryId !== c.id && 'hover:bg-accent',
                                        )}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                <Package className="size-10 text-muted-foreground opacity-30" />
                                <p className="text-sm font-medium">No hay artículos para vender</p>
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
                                <div className={mobileView === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-1.5'}>
                                    {visible.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            price={priceForProduct(product)}
                                            view={mobileView}
                                            dense
                                            stock={stockOf(product)}
                                            onAdd={() => addProduct(product)}
                                        />
                                    ))}
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    {filtered.length > visible.length
                                        ? `Mostrando ${visible.length} de ${filtered.length} — refiná la búsqueda`
                                        : `${filtered.length} ${filtered.length === 1 ? 'artículo' : 'artículos'}`}
                                </p>
                            </>
                        )}
                    </section>
                </TabsContent>

                <TabsContent value="venta" className="mt-0">
                    <section className="flex flex-col">
                        {headerCollapsed ? (
                            <button
                                type="button"
                                onClick={() => setEditingHeader(true)}
                                title="Cambiar el cliente o la lista de precios"
                                className="flex flex-col gap-1 border-b px-4 py-3 text-left"
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
                            <div className="flex flex-col gap-2.5 border-b px-4 py-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-base font-semibold tabular-nums">{nextVoucherNumber ?? 'Comprobante'}</span>
                                    <Badge variant="info">Factura {voucherLetter}</Badge>
                                </div>

                                <FormField label="Cliente" required error={errors.customer_id}>
                                    <Combobox
                                        options={customers.map((c) => ({ value: c.id.toString(), label: c.fantasy_name || c.business_name }))}
                                        value={data.customer_id}
                                        onValueChange={(value) => {
                                            setData('customer_id', value);
                                            setEditingHeader(false);
                                        }}
                                        placeholder="Seleccionar"
                                        searchPlaceholder="Buscar cliente..."
                                        emptyMessage="No se encontraron clientes."
                                        error={errors.customer_id}
                                    />
                                </FormField>

                                {selectedCustomer?.tax_status && (
                                    <Badge variant="secondary" className="self-start">
                                        {taxStatusLabel(selectedCustomer.tax_status)}
                                    </Badge>
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

                                {selectedCustomer && (
                                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingHeader(false)}>
                                        Ocultar
                                    </Button>
                                )}
                            </div>
                        )}

                        <div className="px-4">
                            {itemErrorKeys.length > 0 && (
                                <Alert variant="destructive" className="mt-3">
                                    <AlertTriangle className="size-4" />
                                    <AlertDescription>Revisá los artículos: hay líneas con datos inválidos.</AlertDescription>
                                </Alert>
                            )}

                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center text-muted-foreground">
                                    <ScanLine className="size-8 opacity-30" />
                                    <p className="text-sm">Todavía no agregaste artículos</p>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setTab('catalogo')}>
                                        Ir al catálogo
                                    </Button>
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
                                        error={errorFor(index)}
                                        onChange={(patch) => updateItem(index, patch)}
                                        onSelectProduct={(productId) => selectProductForLine(index, productId)}
                                        onRemove={() => removeItem(index)}
                                    />
                                ))
                            )}

                            {items.length > 0 && (
                                <Button type="button" variant="ghost" size="sm" className="mt-3 w-full" onClick={addEmptyItem}>
                                    <Plus className="size-4" />
                                    Agregar línea manual
                                </Button>
                            )}
                        </div>
                    </section>
                </TabsContent>
            </Tabs>

            {/* ───── BARRA INFERIOR ───── */}
            <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t bg-card px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                        Total
                        {unitCount > 0 && <span className="tabular-nums"> · {unitCount} u.</span>}
                    </p>
                    <p className="truncate text-xl font-semibold text-primary tabular-nums">{fmt(total)}</p>
                </div>
                {/* Misma salida que en el escritorio: la venta se abandona desde
                    el mismo lugar donde se cobra. */}
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

                {/*
                  Se deshabilita sólo si no hay nada que cobrar. Si falta el
                  cliente el botón sigue vivo y lleva a la pestaña donde se
                  elige: en el escritorio el selector está a la vista, acá vive
                  detrás de la otra pestaña, así que un botón apagado dejaría al
                  vendedor sin saber qué le falta.
                */}
                <Button type="button" size="lg" className="shrink-0" disabled={items.length === 0} onClick={startPayment}>
                    Cobrar
                </Button>
            </div>

            {/* ───── COBRO ───── */}
            <Sheet open={paying} onOpenChange={setPaying}>
                <SheetContent side="bottom" className="max-h-[92svh] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Cobrar</SheetTitle>
                    </SheetHeader>

                    <div className="flex flex-col gap-3 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                        {adjustmentsOpen ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <span>Subtotal</span>
                                        {!hasAdjustment && (
                                            <Button
                                                type="button"
                                                variant="link"
                                                size="sm"
                                                onClick={closeAdjustments}
                                                className="h-auto p-0 text-xs text-muted-foreground decoration-dotted"
                                            >
                                                ocultar
                                            </Button>
                                        )}
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
                                    <span className="text-foreground tabular-nums">{discountAmount > 0 ? `−${fmt(discountAmount)}` : fmt(0)}</span>
                                </div>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="link"
                                size="sm"
                                onClick={() => setShowAdjustments(true)}
                                className="h-auto self-start p-0 text-xs text-muted-foreground decoration-dotted"
                            >
                                Agregar recargo o descuento
                            </Button>
                        )}

                        <div className="flex items-baseline justify-between gap-3 border-t pt-3">
                            <span className="text-base font-semibold">Total</span>
                            <span className="text-2xl font-semibold tracking-tight text-primary tabular-nums">{fmt(total)}</span>
                        </div>

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

                        <div className="flex flex-col gap-2">
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
                                <Label htmlFor="auto_payment" className="text-sm font-normal">
                                    Pago automático por el total
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="auto_delivery"
                                    checked={data.auto_delivery}
                                    onCheckedChange={(checked) => setData('auto_delivery', !!checked)}
                                />
                                <Label htmlFor="auto_delivery" className="text-sm font-normal">
                                    Entrega automática de productos
                                </Label>
                            </div>
                        </div>

                        {/* `type="button"` y no submit: el Sheet se dibuja en un portal,
                            así que en el DOM este botón queda fuera del <form> y un
                            submit nativo no encontraría el formulario al que pertenece. */}
                        <Button type="button" size="lg" disabled={!canSubmit} onClick={submit} className="w-full">
                            {processing ? 'Procesando...' : 'Cobrar y facturar'}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </form>
    );
}
