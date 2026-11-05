import { fmt, type SaleForm } from '@/components/sales/use-sale-form';
import { Badge } from '@/components/ui/badge';

/**
 * Qué pasa al confirmar, dicho una sola vez para que las dos pantallas no
 * puedan divergir. No dice «factura» porque no se emite ninguna:
 * `SaleService::create` no llama a ARCA y la venta nace con `cae` en null.
 */
export const SALE_COMMIT_NOTE = 'Queda registrada y descuenta stock. Todavía no se autoriza en ARCA.';

interface SaleRecapProps {
    sale: SaleForm;
    /**
     * Totales, badges de cobro y vuelto. El teléfono los omite porque abajo los
     * tiene editables y repetirlos mostraría el mismo total dos veces.
     */
    withTotals?: boolean;
}

/**
 * Mini comprobante: lo que se está por registrar, en el lenguaje del papel.
 *
 * Muestra **todos** los renglones, no los primeros N. Cortar en «y 6 más» da
 * falsa confianza —el vendedor cree que revisó y vio la mitad— y el error que
 * esta pantalla hace fácil es tocar «+» de más, que en el total no se nota.
 * Con muchos artículos la lista scrollea y el resto queda fijo.
 */
export function SaleRecap({ sale, withTotals = false }: SaleRecapProps) {
    const {
        products,
        items,
        unitCount,
        priceLists,
        data,
        selectedCustomer,
        nextVoucherNumber,
        voucherLetter,
        subtotal,
        surchargeAmount,
        discountAmount,
        discountPct,
        surchargePct,
        total,
        paymentSummary,
        change,
        pendingBalance,
    } = sale;

    const priceList = priceLists.find((l) => l.id.toString() === data.price_list_id);

    return (
        <div className="overflow-hidden rounded-md border">
            <div className="flex flex-col gap-0.5 border-b bg-muted/40 px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2.5">
                    <span className="text-sm font-semibold tabular-nums">{nextVoucherNumber ?? 'Comprobante'}</span>
                    <Badge variant="info">Factura {voucherLetter}</Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                    {selectedCustomer?.fantasy_name || selectedCustomer?.business_name}
                    {priceList && ` · ${priceList.name}`}
                </p>
            </div>

            {/* La columna de la derecha es el importe del renglón, no el precio
                unitario: nombrarla «Precio» sobre un $900 que son dos focos de
                $450 confundiría justo donde hay que verificar. */}
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-2.5 border-b bg-muted/40 px-3.5 py-1.5 text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
                <span>Cant.</span>
                <span>Descripción</span>
                <span className="text-right">Importe</span>
            </div>

            <div className="max-h-44 overflow-y-auto">
                {items.map((item, index) => {
                    const product = products.find((p) => p.id.toString() === item.product_id);
                    return (
                        <div
                            key={index}
                            className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-baseline gap-2.5 border-b px-3.5 py-1.5 text-xs last:border-b-0"
                        >
                            <span className="text-muted-foreground tabular-nums">{item.quantity} ×</span>
                            <span className="truncate" title={product?.name}>
                                {product?.name ?? 'Artículo'}
                            </span>
                            <span className="text-right font-medium tabular-nums">{fmt(item.quantity * item.price)}</span>
                        </div>
                    );
                })}
            </div>

            {/* El conteo va al pie y no arriba: sirve para saber si llegaste al
                final de la lista, y ahí es donde se lo busca. */}
            <div className="border-t bg-muted/40 px-3.5 py-1.5 text-[0.7rem] text-muted-foreground">
                {items.length} {items.length === 1 ? 'artículo' : 'artículos'} · {unitCount} {unitCount === 1 ? 'unidad' : 'unidades'}
            </div>

            {withTotals && (
                <>
                    <div className="flex flex-col gap-1.5 px-3.5 py-2.5">
                        {(surchargeAmount > 0 || discountAmount > 0) && (
                            <>
                                <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="text-foreground tabular-nums">{fmt(subtotal)}</span>
                                </div>
                                {surchargeAmount > 0 && (
                                    <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                                        <span>Recargo {surchargePct}%</span>
                                        <span className="text-foreground tabular-nums">{fmt(surchargeAmount)}</span>
                                    </div>
                                )}
                                {discountAmount > 0 && (
                                    <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                                        <span>Descuento {discountPct}%</span>
                                        <span className="text-foreground tabular-nums">−{fmt(discountAmount)}</span>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="flex items-baseline justify-between gap-3 border-t pt-2">
                            <span className="text-sm font-semibold">Total</span>
                            <span className="text-xl font-semibold tracking-tight text-primary tabular-nums">{fmt(total)}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 px-3.5 pb-2.5">
                        {paymentSummary.map((chip) => (
                            <Badge key={chip.label} variant={chip.variant}>
                                {chip.label}
                            </Badge>
                        ))}
                    </div>

                    {/*
                      Vuelto y saldo pendiente son los dos números que el cajero
                      necesita justo después de apretar y no puede recalcular de
                      memoria. Nunca aparecen juntos: el vuelto sale del pago
                      automático y el saldo de haberlo destildado.

                      El saldo va además porque el badge «Pago parcial» avisa del
                      estado pero no de cuánto, y eso es lo que hay que decidir.
                    */}
                    {change > 0 && (
                        <div className="mx-3.5 mb-3 flex items-center justify-between gap-3 rounded-md bg-success-soft px-3 py-2">
                            <span className="text-xs font-medium text-success">Vuelto</span>
                            <span className="text-sm font-semibold text-success tabular-nums">{fmt(change)}</span>
                        </div>
                    )}

                    {pendingBalance > 0 && (
                        <div className="mx-3.5 mb-3 flex items-center justify-between gap-3 rounded-md bg-warning-soft px-3 py-2">
                            <span className="text-xs font-medium text-warning">Saldo pendiente</span>
                            <span className="text-sm font-semibold text-warning tabular-nums">{fmt(pendingBalance)}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
