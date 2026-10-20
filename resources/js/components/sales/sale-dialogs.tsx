import { SALE_COMMIT_NOTE, SaleRecap } from '@/components/sales/sale-recap';
import { fmt, type SaleForm } from '@/components/sales/use-sale-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DiscardSaleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: SaleForm;
    onConfirm: () => void;
}

/**
 * Abandonar lo cargado en pantalla.
 *
 * Se llama «descartar» y no «cancelar» a propósito: en este sistema *cancelar
 * una venta* es anular un comprobante ya emitido —restaura el inventario
 * entregado y acredita lo pagado al cliente—, y vive en el listado y en el
 * detalle con su propia confirmación. Usar la misma palabra para las dos haría
 * que un vendedor que aprendió a desconfiar de «cancelar» dude también acá,
 * donde no hay nada que temer, y al revés.
 */
export function DiscardSaleDialog({ open, onOpenChange, sale, onConfirm }: DiscardSaleDialogProps) {
    const { items, total } = sale;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Descartar esta venta?</DialogTitle>
                    <DialogDescription>
                        Se quitan{' '}
                        <b className="text-foreground">
                            {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                        </b>{' '}
                        por <b className="text-foreground tabular-nums">{fmt(total)}</b>. La venta todavía no se emitió, así que no queda ningún
                        registro: se pierde sólo lo cargado.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Volver
                    </Button>
                    <Button type="button" variant="destructive" onClick={onConfirm}>
                        Descartar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface ConfirmSaleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: SaleForm;
}

/**
 * Última puerta antes de registrar la venta, en el escritorio.
 *
 * El teléfono no lo usa: la hoja que abre «Cobrar» ya es ese paso, y un diálogo
 * encima serían tres para lo que se resolvía en dos.
 *
 * No dice «facturar» porque no se factura: `SaleService::create` no llama a
 * ARCA. La autorización es una acción aparte (`afip.authorize`) y la venta nace
 * sin CAE. Prometer una factura acá haría que alguien se saltee ese paso
 * creyendo que ya está hecho.
 *
 * Tampoco dice «Cobrar»: `StoreSaleRequest` acepta `payment_amount` con `min:0`
 * y `canSubmit` no exige que sea mayor a cero, así que una venta entera a cuenta
 * corriente no cobra nada —y un pago parcial cobra una parte—. «Confirmar venta»
 * es cierto en los tres casos.
 */
export function ConfirmSaleDialog({ open, onOpenChange, sale }: ConfirmSaleDialogProps) {
    const { submit, processing, canSubmit } = sale;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Revisá la venta</DialogTitle>
                </DialogHeader>

                <SaleRecap sale={sale} withTotals />

                <p className="text-xs text-muted-foreground">{SALE_COMMIT_NOTE}</p>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Volver
                    </Button>
                    {/* `autoFocus` para que la secuencia siga siendo teclado: F2 abre,
                        Enter confirma. */}
                    <Button type="button" autoFocus disabled={!canSubmit} onClick={submit}>
                        {processing ? 'Procesando...' : 'Confirmar venta'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
