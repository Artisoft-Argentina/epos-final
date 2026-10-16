import { Package, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type CatalogView = 'grid' | 'list';

export interface CatalogProduct {
    id: number;
    name: string;
    sku: string;
    category?: { id: number; name: string } | null;
    images?: { id: number; path: string; is_primary: boolean }[];
}

interface ProductCardProps {
    product: CatalogProduct;
    price: number;
    view: CatalogView;
    /** Resaltado por teclado (flechas). */
    highlighted?: boolean;
    /** Stock total del artículo. Mientras el backend no lo envíe, no se muestra. */
    stock?: number | null;
    onAdd: () => void;
    onHover?: () => void;
}

const fmt = (n: number): string =>
    `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function primaryImage(product: CatalogProduct) {
    return product.images?.find((i) => i.is_primary) ?? product.images?.[0];
}

/**
 * Artículo del catálogo. Es siempre un botón: todo el bloque agrega a la venta.
 *
 * Se dibuja en grilla o en lista según la vista elegida, pero en las dos
 * conserva la misma anatomía —precio, stock y el signo de agregar— que es lo
 * que lo distingue del renglón del comprobante, donde hay cantidad editable y
 * botón de eliminar. Esa diferencia es deliberada: si se parecieran, volvería
 * la confusión entre lo que se puede agregar y lo que ya está cargado.
 */
export function ProductCard({ product, price, view, highlighted, stock, onAdd, onHover }: ProductCardProps) {
    const img = primaryImage(product);
    const outOfStock = stock !== undefined && stock !== null && stock <= 0;

    const stockBadge =
        stock === undefined || stock === null ? null : (
            <Badge variant={outOfStock ? 'destructive' : stock <= 5 ? 'warning' : 'success'}>{stock}</Badge>
        );

    if (view === 'list') {
        return (
            <button
                type="button"
                onClick={onAdd}
                onMouseEnter={onHover}
                className={cn(
                    'flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left transition-colors',
                    highlighted ? 'border-primary bg-accent' : 'hover:bg-accent',
                    outOfStock && 'opacity-60',
                )}
            >
                {img ? (
                    <img src={`/storage/${img.path}`} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                ) : (
                    <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                        <Package className="text-muted-foreground size-4" />
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                        {product.sku}
                        {product.category?.name ? ` · ${product.category.name}` : ''}
                    </p>
                </div>

                {stockBadge}
                <span className="text-primary shrink-0 text-sm font-semibold tabular-nums">{fmt(price)}</span>
                <span className="bg-primary text-primary-foreground grid size-7 shrink-0 place-items-center rounded-md">
                    <Plus className="size-4" />
                </span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onAdd}
            onMouseEnter={onHover}
            className={cn(
                'flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-colors',
                highlighted ? 'border-primary ring-primary/20 ring-2' : 'hover:border-primary/30',
                outOfStock && 'opacity-60',
            )}
        >
            <div className="bg-muted relative flex h-24 items-center justify-center">
                {img ? (
                    <img src={`/storage/${img.path}`} alt="" className="size-full object-cover" />
                ) : (
                    <Package className="text-muted-foreground size-6" />
                )}
                {stockBadge && <span className="absolute right-1.5 top-1.5">{stockBadge}</span>}
            </div>

            <div className="flex flex-1 flex-col gap-0.5 p-3">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
                <p className="text-muted-foreground text-xs">{product.sku}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="text-primary text-sm font-semibold tabular-nums">{fmt(price)}</span>
                    <span className="bg-primary text-primary-foreground grid size-7 shrink-0 place-items-center rounded-md">
                        <Plus className="size-4" />
                    </span>
                </div>
            </div>
        </button>
    );
}
