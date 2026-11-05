import { cloneElement, isValidElement, type ReactElement, useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Method = 'patch' | 'put' | 'post' | 'delete';

interface ConfirmActionDialogProps {
    url: string;
    method?: Method;
    title: string;
    description?: string;
    confirmLabel?: string;
    processingLabel?: string;
    confirmVariant?: React.ComponentProps<typeof Button>['variant'];
    /** Elemento que dispara el diálogo (Button, ActionButton, etc.). Se le inyecta onClick. */
    trigger: ReactElement;
}

/**
 * Diálogo de confirmación genérico para acciones que mutan estado por cualquier
 * método HTTP (PATCH/PUT/POST/DELETE). Para eliminar registros usar
 * DeleteConfirmationDialog; este sirve para acciones como "Cancelar venta".
 */
export function ConfirmActionDialog({
    url,
    method = 'post',
    title,
    description,
    confirmLabel = 'Confirmar',
    processingLabel = 'Procesando...',
    confirmVariant = 'destructive',
    trigger,
}: ConfirmActionDialogProps) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const submit = () => {
        setProcessing(true);
        router.visit(url, {
            method,
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setOpen(false);
            },
        });
    };

    return (
        <>
            {isValidElement(trigger)
                ? cloneElement(trigger as ReactElement<{ onClick?: () => void }>, { onClick: () => setOpen(true) })
                : null}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Volver</Button>
                        <Button variant={confirmVariant} onClick={submit} disabled={processing}>
                            {processing ? processingLabel : confirmLabel}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
