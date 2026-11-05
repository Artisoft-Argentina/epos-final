import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Package, Plus } from 'lucide-react';

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
    /** Fila de dos renglones, para anchos de teléfono. Sólo aplica a la vista lista. */
    dense?: boolean;
    /** Stock del artículo en el almacén del punto de venta. */
    stock?: number | null;
    onAdd: () => void;
    onHover?: () => void;
}

const fmt = (n: number): string => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
export function ProductCard({ product, price, view, highlighted, dense, stock, onAdd, onHover }: ProductCardProps) {
    const img = primaryImage(product);
    const outOfStock = stock !== undefined && stock !== null && stock <= 0;

    const stockBadge =
        stock === undefined || stock === null ? null : (
            <Badge variant={outOfStock ? 'destructive' : stock <= 5 ? 'warning' : 'success'}>{stock}</Badge>
        );

    /*
     * Fila angosta, para el teléfono. Los mismos datos pero en dos renglones:
     * a 390px la fila de una línea deja 121px para el nombre —unos quince
     * caracteres— y corta casi todo el catálogo. Apilada, el nombre se lleva el
     * ancho entero y la fila sigue midiendo un tercio de lo que mide una ficha.
     */
    if (view === 'list' && dense) {
        return (
            <button
                type="button"
                onClick={onAdd}
                onMouseEnter={onHover}
                className={cn(
                    'flex w-full flex-col gap-0.5 rounded-lg border bg-card px-3 py-2 text-left transition-colors',
                    highlighted ? 'border-primary bg-accent' : 'hover:bg-accent',
                    outOfStock && 'opacity-60',
                )}
            >
                <div className="flex w-full items-start gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</p>
                    {stockBadge}
                </div>

                <div className="flex w-full items-center gap-2">
                    <span className="truncate text-xs text-muted-foreground">{product.sku}</span>
                    <span className="ml-auto shrink-0 text-sm font-semibold text-primary tabular-nums">{fmt(price)}</span>
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                        <Plus className="size-3.5" />
                    </span>
                </div>
            </button>
        );
    }

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
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Package className="size-4 text-muted-foreground" />
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {product.sku}
                        {product.category?.name ? ` · ${product.category.name}` : ''}
                    </p>
                </div>

                {stockBadge}
                <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{fmt(price)}</span>
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
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
                highlighted ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/30',
                outOfStock && 'opacity-60',
            )}
        >
            <div className="relative flex h-24 items-center justify-center bg-muted">
                {img ? (
                    <img src={`/storage/${img.path}`} alt="" className="size-full object-cover" />
                ) : (
                    <Package className="size-6 text-muted-foreground" />
                )}
                {stockBadge && <span className="absolute top-1.5 right-1.5">{stockBadge}</span>}
            </div>

            <div className="flex flex-1 flex-col gap-0.5 p-3">
                <p className="line-clamp-2 text-sm leading-snug font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.sku}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="text-sm font-semibold text-primary tabular-nums">{fmt(price)}</span>
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                        <Plus className="size-4" />
                    </span>
                </div>
            </div>
        </button>
    );
}
