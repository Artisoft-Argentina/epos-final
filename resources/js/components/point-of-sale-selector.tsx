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
    const { pointsOfSale, activePointOfSaleId } = usePage<any>().props;

    if (!pointsOfSale || pointsOfSale.length <= 1) return null;

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
