import { router, usePage } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store } from 'lucide-react';

interface PointOfSale {
    id: number;
    name: string;
    pos_number: number;
    warehouse_id: number;
    warehouse?: { id: number; name: string };
}

export function PointOfSaleSelector() {
    const { pointsOfSale, activePointOfSaleId, auth } = usePage<any>().props;
    const isVendedor = auth?.user?.is_vendedor ?? false;

    if (!pointsOfSale || pointsOfSale.length === 0) return null;

    // Vendedor: badge fijo (sin selector). El admin lo asigna desde Users/Edit.
    if (isVendedor) {
        const myPos = (pointsOfSale as PointOfSale[]).find((p) => p.id === activePointOfSaleId);
        if (!myPos) return null;
        return (
            <div className="flex items-center gap-1.5" title="PV asignado por administrador">
                <Store className="size-4 text-muted-foreground" />
                <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                    {myPos.name} <span className="text-muted-foreground">(#{myPos.pos_number})</span>
                </span>
            </div>
        );
    }

    // Admin/superadmin: dropdown editable como antes
    if (pointsOfSale.length <= 1) return null;

    const handleChange = (value: string) => {
        router.post(route('puntos-venta.set-active'), { point_of_sale_id: value }, { preserveState: true });
    };

    return (
        <div className="flex items-center gap-1.5">
            <Store className="size-4 text-muted-foreground" />
            <Select value={String(activePointOfSaleId ?? '')} onValueChange={handleChange}>
                <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="Punto de venta" />
                </SelectTrigger>
                <SelectContent>
                    {(pointsOfSale as PointOfSale[]).map((pos) => (
                        <SelectItem key={pos.id} value={String(pos.id)}>
                            {pos.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
