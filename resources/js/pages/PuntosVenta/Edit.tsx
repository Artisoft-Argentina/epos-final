import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Warehouse {
    id: number;
    name: string;
}

interface PuntoVenta {
    id: number;
    name: string;
    pos_number: number;
    warehouse_id: number;
    voucher_letter_default: string;
    next_invoice_number_a: number;
    next_invoice_number_b: number;
    next_invoice_number_c: number;
    is_default: boolean;
    active: boolean;
}

interface Props {
    puntoVenta: PuntoVenta;
    warehouses: Warehouse[];
}

export default function Edit({ puntoVenta, warehouses }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: puntoVenta.name,
        pos_number: String(puntoVenta.pos_number),
        warehouse_id: String(puntoVenta.warehouse_id),
        voucher_letter_default: puntoVenta.voucher_letter_default,
        next_invoice_number_a: String(puntoVenta.next_invoice_number_a),
        next_invoice_number_b: String(puntoVenta.next_invoice_number_b),
        next_invoice_number_c: String(puntoVenta.next_invoice_number_c),
        is_default: puntoVenta.is_default,
        active: puntoVenta.active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('puntos-venta.update', puntoVenta.id));
    };

    return (
        <AppLayout>
            <Head title={`Editar ${puntoVenta.name}`} />
            <div className="p-6">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Editar Punto de Venta</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <FormField label="Nombre" htmlFor="name" error={errors.name} required>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} />
                            </FormField>
                            <FormField label="Número de Punto de Venta (ARCA)" htmlFor="pos_number" error={errors.pos_number} required>
                                <Input id="pos_number" type="number" min="1" max="99999" value={data.pos_number} onChange={(e) => setData('pos_number', e.target.value)} error={errors.pos_number} />
                            </FormField>
                            <FormField label="Almacén" htmlFor="warehouse_id" error={errors.warehouse_id} required>
                                <Select value={data.warehouse_id} onValueChange={(v) => setData('warehouse_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar almacén" /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((w) => (
                                            <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField label="Letra por defecto" htmlFor="voucher_letter_default" error={errors.voucher_letter_default} required>
                                <Select value={data.voucher_letter_default} onValueChange={(v) => setData('voucher_letter_default', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A">A</SelectItem>
                                        <SelectItem value="B">B</SelectItem>
                                        <SelectItem value="C">C</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField label="Próx. Nº A" htmlFor="next_invoice_number_a" error={errors.next_invoice_number_a}>
                                    <Input id="next_invoice_number_a" type="number" min="1" value={data.next_invoice_number_a} onChange={(e) => setData('next_invoice_number_a', e.target.value)} />
                                </FormField>
                                <FormField label="Próx. Nº B" htmlFor="next_invoice_number_b" error={errors.next_invoice_number_b}>
                                    <Input id="next_invoice_number_b" type="number" min="1" value={data.next_invoice_number_b} onChange={(e) => setData('next_invoice_number_b', e.target.value)} />
                                </FormField>
                                <FormField label="Próx. Nº C" htmlFor="next_invoice_number_c" error={errors.next_invoice_number_c}>
                                    <Input id="next_invoice_number_c" type="number" min="1" value={data.next_invoice_number_c} onChange={(e) => setData('next_invoice_number_c', e.target.value)} />
                                </FormField>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id="is_default" checked={data.is_default} onCheckedChange={(v) => setData('is_default', v)} />
                                <Label htmlFor="is_default">Punto de venta por defecto</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id="active" checked={data.active} onCheckedChange={(v) => setData('active', v)} />
                                <Label htmlFor="active">Activo</Label>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>{processing ? 'Actualizando...' : 'Actualizar'}</Button>
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
