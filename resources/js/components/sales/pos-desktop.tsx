import { FormField } from '@/components/form-field';
import { Kbd, PercentInput } from '@/components/sales/pos-bits';
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
import { usePermission } from '@/hooks/use-permission';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { AlertTriangle, Camera, ChevronDown, ChevronUp, LayoutGrid, List, Package, Pencil, Plus, ScanLine, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Shell de escritorio: el catálogo a la izquierda y el comprobante a la
 * derecha, los dos visibles a la vez. Sólo decide cómo se dibuja; las reglas de
 * la venta viven en `useSaleForm`.
 */
export function PosDesktop({ sale }: { sale: SaleForm }) {
    const { can } = usePermission();
    const {
        products,
        priceLists,
        warehouses,
        paymentMethods,
        activePos,
        posWarehouseName,
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
        highlight,
        setHighlight,
        picking,
        setPicking,
        view,
        setView,
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
        paymentSummary,
        paymentNeedsAttention,
        summaryCollapsed,
        setSummaryFolded,
    } = sale;

    const visible = filtered.slice(0, capacity[view]);

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
    }, [canSubmit, searchInputRef]);

    return (
        <form
            ref={shellRef}
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
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
                            onKeyDown={(e) => handleSearchKeyDown(e, visible)}
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
                            /* Las clases salen de `badgeVariants`, que es la misma
                               fuente que usa <Badge>, en vez de copiarlas a mano.
                               No se usa <Badge asChild> porque está roto: con
                               `dot` en false le pasa dos hijos al Slot de Radix,
                               que exige uno. */
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setCategoryId(c.id)}
                                aria-pressed={categoryId === c.id}
                                className={cn(
                                    badgeVariants({ variant: categoryId === c.id ? 'default' : 'outline' }),
                                    'cursor-pointer',
                                    categoryId !== c.id && 'hover:bg-accent',
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
                            <span className="truncate text-sm font-medium">{selectedCustomer?.fantasy_name || selectedCustomer?.business_name}</span>
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
                                error={errorFor(index)}
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
                                        <Button
                                            type="button"
                                            onClick={closeAdjustments}
                                            disabled={hasAdjustment}
                                            title={hasAdjustment ? 'Poné recargo y descuento en 0 para ocultarlos' : 'Ocultar recargo y descuento'}
                                            variant="outline"
                                            size="icon"
                                            className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                                        >
                                            <ChevronDown className="size-3.5" />
                                        </Button>
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
                                    <span className="text-foreground tabular-nums">{discountAmount > 0 ? `−${fmt(discountAmount)}` : fmt(0)}</span>
                                </div>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="link"
                                size="sm"
                                onClick={() => setShowAdjustments(true)}
                                className="h-auto self-start p-0 text-xs text-muted-foreground decoration-dotted hover:text-foreground"
                            >
                                Agregar recargo o descuento
                            </Button>
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
                                <Button
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
                                    variant="outline"
                                    size="icon"
                                    className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                                >
                                    {summaryCollapsed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                                </Button>
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
    );
}
