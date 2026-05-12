import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
        if (!name.trim()) { setError('El nombre es obligatorio.'); return; }

        setProcessing(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch(route(routeName), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken ?? '',
                },
                body: JSON.stringify({ name: name.trim(), active: true }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.errors?.name?.[0] ?? 'Error al crear.');
                return;
            }

            const item = await res.json();
            onSuccess({ id: item.id, name: item.name });
            setName('');
            setError(undefined);
            setOpen(false);
        } catch {
            setError('Error de conexión.');
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
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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
