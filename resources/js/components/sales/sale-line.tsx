import type { CatalogProduct } from '@/components/sales/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowRightLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface SaleItem {
    product_id: string;
    quantity: number;
    price: number;
    warehouse_id: string;
}

export interface LineWarehouse {
    id: number;
    name: string;
}

export interface WarehouseStock {
    warehouse_id: number;
    warehouse_name: string;
    quantity: number;
    is_pos_warehouse: boolean;
}

interface SaleLineProps {
    item: SaleItem;
    product?: CatalogProduct;
    /** Catálogo completo: sólo lo usa la línea manual, que todavía no eligió artículo. */
    products: CatalogProduct[];
    warehouses: LineWarehouse[];
    stocks: WarehouseStock[];
    error?: string;
    onChange: (patch: Partial<SaleItem>) => void;
    onSelectProduct: (productId: string) => void;
    onRemove: () => void;
}

const fmt = (n: number): string => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Renglón del comprobante. A diferencia del artículo del catálogo, acá la
 * cantidad es editable y existe el botón de eliminar —visible siempre, no sólo
 * al pasar el mouse, porque en una tablet el hover no existe.
 *
 * El importe manda y el precio unitario va debajo en chico, como en un
 * comprobante impreso. Ese unitario se puede corregir: se toca y se convierte
 * en un input. Antes era un input siempre visible, que se comía el ancho del
 * renglón y hacía competir al importe —el número que de verdad se mira— con un
 * campo que casi nunca se usa.
 */
export function SaleLine({ item, product, products, warehouses, stocks, error, onChange, onSelectProduct, onRemove }: SaleLineProps) {
    const [editingPrice, setEditingPrice] = useState(false);
    const priceRef = useRef<HTMLDivElement>(null);

    // Al abrir el editor el foco va al input: se toca el unitario y se tipea,
    // sin un segundo clic.
    useEffect(() => {
        if (editingPrice) priceRef.current?.querySelector('input')?.focus();
    }, [editingPrice]);

    const selectedStock = stocks.find((s) => String(s.warehouse_id) === item.warehouse_id);
    const stockHere = selectedStock?.quantity ?? 0;
    const missing = item.product_id ? item.quantity - stockHere : 0;
    const insufficient = missing > 0;
    const otherStock = stocks.filter((s) => String(s.warehouse_id) !== item.warehouse_id && s.quantity >= item.quantity);

    // El selector de almacén sólo aparece si hay entre qué elegir. Con uno solo
    // el renglón pasa de tres filas a dos, que es la diferencia entre ver dos
    // artículos del comprobante o cinco; el stock ya se lee en el catálogo.
    const pickWarehouse = warehouses.length > 1;
    const showExtra = !!item.product_id && (pickWarehouse || insufficient);

    return (
        <div className="flex flex-col gap-1.5 border-b py-3 last:border-b-0">
            {/*
              Sin miniatura, a diferencia del catálogo: acá el artículo ya está
              elegido y la foto no agrega nada, mientras que los 40px que ocupa
              son los que le faltan al nombre para no cortarse.
            */}
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    {product ? (
                        <>
                            <p className="truncate text-sm leading-snug font-medium" title={product.name}>
                                {product.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{product.sku}</p>
                        </>
                    ) : (
                        <Select value={item.product_id} onValueChange={onSelectProduct}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Seleccionar artículo" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.sku} — {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Cantidad */}
                <div className="flex shrink-0 items-center gap-0.5 rounded-md bg-muted p-0.5">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 bg-card"
                        onClick={() => item.quantity > 1 && onChange({ quantity: item.quantity - 1 })}
                        title="Quitar una unidad"
                    >
                        <Minus className="size-3" />
                    </Button>
                    <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onChange({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        min={1}
                        aria-label="Cantidad"
                        className="h-6 w-8 [appearance:textfield] border-0 bg-transparent p-0 text-center text-sm font-medium tabular-nums shadow-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 bg-card"
                        onClick={() => onChange({ quantity: item.quantity + 1 })}
                        title="Agregar una unidad"
                    >
                        <Plus className="size-3" />
                    </Button>
                </div>

                {/*
                  Importe, con el unitario debajo. El unitario aparece sólo con
                  más de una unidad: con una sola repite el mismo número dos
                  veces, y en un carrito de ocho renglones son ocho líneas de
                  ruido justo donde hay que leer los precios. Con una unidad el
                  importe *es* el precio, así que se corrige tocándolo a él.
                */}
                <div className="shrink-0 text-right">
                    {editingPrice ? (
                        <div ref={priceRef} onBlur={() => setEditingPrice(false)}>
                            <MoneyInput value={item.price} onValueChange={(v) => onChange({ price: v })} className="h-7 w-24 text-xs" />
                        </div>
                    ) : item.quantity > 1 ? (
                        <>
                            <p className="text-sm font-semibold tabular-nums">{fmt(item.quantity * item.price)}</p>
                            <button
                                type="button"
                                onClick={() => setEditingPrice(true)}
                                title="Corregir el precio unitario"
                                className="text-xs text-muted-foreground tabular-nums underline decoration-dotted underline-offset-2 hover:text-foreground"
                            >
                                {fmt(item.price)} c/u
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setEditingPrice(true)}
                            title="Corregir el precio"
                            // Sin subrayado fijo: ocho precios subrayados se leen
                            // como ocho enlaces. Aparece al pasar el mouse.
                            className="cursor-pointer text-sm font-semibold tabular-nums underline-offset-2 hover:underline hover:decoration-dotted"
                        >
                            {fmt(item.price)}
                        </button>
                    )}
                </div>

                <Button type="button" variant="destructive-soft" size="icon" className="size-7 shrink-0" onClick={onRemove} title="Quitar artículo">
                    <Trash2 className="size-3.5" />
                </Button>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            {showExtra && (
                <div className="flex flex-wrap items-center gap-2">
                    {pickWarehouse && (
                        <Select value={item.warehouse_id} onValueChange={(v) => onChange({ warehouse_id: v })}>
                            <SelectTrigger className="h-8 w-auto min-w-[150px] text-xs">
                                <SelectValue placeholder="Almacén" />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map((w) => {
                                    const s = stocks.find((st) => st.warehouse_id === w.id);
                                    return (
                                        <SelectItem key={w.id} value={String(w.id)}>
                                            {w.name} ({s ? s.quantity : 0})
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    )}

                    {insufficient && (
                        <>
                            <Badge variant="warning">Falta {missing}</Badge>

                            {/* Los otros almacenes son accionables: se toca y el renglón cambia de almacén. */}
                            {otherStock.slice(0, 2).map((s) => (
                                <Button
                                    key={s.warehouse_id}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6 rounded-full px-2.5 text-xs"
                                    onClick={() => onChange({ warehouse_id: String(s.warehouse_id) })}
                                    title={`Tomar el artículo de ${s.warehouse_name}`}
                                >
                                    {s.warehouse_name} tiene {s.quantity}
                                </Button>
                            ))}

                            {otherStock.length > 0 ? (
                                <a
                                    href={route('transferencias.create')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground underline hover:text-primary"
                                >
                                    <ArrowRightLeft className="size-3" />
                                    Transferir
                                </a>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-destructive">
                                    <AlertTriangle className="size-3.5" />
                                    Sin stock en ningún almacén
                                </span>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
