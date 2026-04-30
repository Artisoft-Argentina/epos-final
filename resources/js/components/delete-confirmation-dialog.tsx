import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
    url: string;
    title?: string;
    description?: string;
}

export function DeleteConfirmationDialog({ url, title = "Confirmar eliminación", description = "¿Está seguro que desea eliminar este elemento? Esta acción no se puede deshacer." }: DeleteConfirmationDialogProps) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleDelete = () => {
        setProcessing(true);
        router.delete(url, {
            onFinish: () => {
                setProcessing(false);
                setOpen(false);
            }
        });
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="destructive-soft" size="icon" className="size-8" onClick={() => setOpen(true)}>
                        <Trash2 className="size-3.5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Eliminar</TooltipContent>
            </Tooltip>
            
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                            {processing ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}