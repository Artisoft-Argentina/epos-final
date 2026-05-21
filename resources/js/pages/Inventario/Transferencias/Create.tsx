import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Warehouse {
    id: number;
    name: string;
}

interface StockEntry {
    product_id: number;
    product_name: string;
    product_sku: string;
    warehouse_id: number;
    available: number;
}

interface TransferItem {
    product_id: number;
    product_name: string;
    quantity: number;
    available: number;
}

interface Props {
    warehouses: Warehouse[];
    stocks: StockEntry[];
}

export default function Create({ warehouses, stocks }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        origin_warehouse_id: string;
        destination_warehouse_id: string;
        notes: string;
        items: TransferItem[];
    }>({
        origin_warehouse_id: '',
        destination_warehouse_id: '',
        notes: '',
        items: [],
    });

    const [search, setSearch] = useState('');
    const [showResults, setShowResults] = useState(false);

    const filteredStocks = useMemo(() => {
        if (!data.origin_warehouse_id || !search.trim()) return [];
        const term = search.toLowerCase();
        return stocks
            .filter((s) =>
                String(s.warehouse_id) === data.origin_warehouse_id &&
                (s.product_name.toLowerCase().includes(term) ||
                 s.product_sku.toLowerCase().includes(term))
            )
            .slice(0, 20);
    }, [stocks, data.origin_warehouse_id, search]);

    const handleSearch = (value: string) => {
        setSearch(value);
        setShowResults(value.length > 0 && !!data.origin_warehouse_id);
    };

    const addItem = (entry: StockEntry) => {
        if (data.items.some((i) => i.product_id === entry.product_id)) return;
        setData('items', [...data.items, {
            product_id: entry.product_id,
            product_name: entry.product_name,
            quantity: 1,
            available: entry.available,
        }]);
        setSearch('');
        setShowResults(false);
    };

    const updateQuantity = (index: number, qty: number) => {
        const items = [...data.items];
        items[index].quantity = qty;
        setData('items', items);
    };

    const removeItem = (index: number) => {
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('transferencias.store'));
    };

    return (
        <AppLayout>
            <Head title="Nueva Transferencia" />
            <div className="p-6">
                <Card className="max-w-3xl">
                    <CardHeader><CardTitle>Nueva Transferencia</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Almacén Origen" htmlFor="origin" error={errors.origin_warehouse_id} required>
                                    <Select value={data.origin_warehouse_id} onValueChange={(v) => { setData('origin_warehouse_id', v); setSearch(''); setShowResults(false); }}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map((w) => (
                                                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                                <FormField label="Almacén Destino" htmlFor="destination" error={errors.destination_warehouse_id} required>
                                    <Select value={data.destination_warehouse_id} onValueChange={(v) => setData('destination_warehouse_id', v)}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                        <SelectContent>
                                            {warehouses.filter((w) => String(w.id) !== data.origin_warehouse_id).map((w) => (
                                                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                            </div>

                            <FormField label="Notas" htmlFor="notes" error={errors.notes}>
                                <Input id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Observaciones opcionales" />
                            </FormField>

                            {/* Buscador de productos */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Agregar productos</label>
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                                    <Input
                                        value={search}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        onFocus={() => setShowResults(search.length > 0 && !!data.origin_warehouse_id)}
                                        onBlur={() => setTimeout(() => setShowResults(false), 150)}
                                        placeholder={data.origin_warehouse_id ? 'Buscar por nombre o SKU...' : 'Seleccioná un almacén origen primero'}
                                        disabled={!data.origin_warehouse_id}
                                        className="pl-10"
                                    />
                                    {showResults && (
                                        <div className="absolute z-10 mt-1 w-full overflow-auto rounded-lg border bg-card shadow-lg max-h-72">
                                            {filteredStocks.length === 0 ? (
                                                <div className="px-4 py-3 text-sm text-muted-foreground">
                                                    Sin resultados con stock en este almacén.
                                                </div>
                                            ) : (
                                                filteredStocks.map((s) => (
                                                    <div
                                                        key={s.product_id}
                                                        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-accent"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => addItem(s)}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">{s.product_name}</p>
                                                            <p className="text-muted-foreground text-xs font-mono">{s.product_sku}</p>
                                                        </div>
                                                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                                                            Disp: {s.available}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items */}
                            {data.items.length > 0 && (
                                <div className="border rounded-md">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left px-3 py-2">Producto</th>
                                                <th className="text-center px-3 py-2 w-28">Disponible</th>
                                                <th className="text-center px-3 py-2 w-28">Cantidad</th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {data.items.map((item, i) => (
                                                <tr key={item.product_id}>
                                                    <td className="px-3 py-2">{item.product_name}</td>
                                                    <td className="text-center px-3 py-2 text-muted-foreground">{item.available}</td>
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max={item.available}
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(i, parseInt(e.target.value) || 1)}
                                                            className="w-20 mx-auto text-center"
                                                        />
                                                    </td>
                                                    <td className="px-1">
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>
                                                            <Trash2 className="size-4 text-destructive" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {errors.items && <p className="text-sm text-destructive">{errors.items}</p>}

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing || data.items.length === 0}>
                                    {processing ? 'Creando...' : 'Crear Transferencia'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
