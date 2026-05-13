import axios from 'axios';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { FormField } from '@/components/form-field';
import { Plus } from 'lucide-react';

interface QuickCreateDialogProps {
    title: string;
    placeholder: string;
    routeName: string;
    onSuccess: (item: { id: number; name: string }) => void;
}

export function QuickCreateDialog({ title, placeholder, routeName, onSuccess }: QuickCreateDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | undefined>();
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async () => {
        if (processing) return;
        if (!name.trim()) { setError('El nombre es obligatorio.'); return; }

        setProcessing(true);
        try {
            const { data: item } = await axios.post(route(routeName), { name: name.trim(), active: true });
            router.flushAll();
            onSuccess({ id: item.id, name: item.name });
            setName('');
            setError(undefined);
            setOpen(false);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.errors?.name?.[0] ?? 'Error al crear.');
            } else {
                setError('Error de conexión.');
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => { setName(''); setError(undefined); setOpen(true); }}
                    >
                        <Plus className="size-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{title}</TooltipContent>
            </Tooltip>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>Completá el nombre para crear.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <FormField label="Nombre" htmlFor="quick-name" error={error} required>
                            <Input
                                id="quick-name"
                                value={name}
                                onChange={(e) => { setName(e.target.value); setError(undefined); }}
                                placeholder={placeholder}
                                error={error}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
                            />
                        </FormField>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={processing}>
                            {processing ? 'Creando...' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
