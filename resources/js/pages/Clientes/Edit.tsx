import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/form-field';
import { useState, useEffect } from 'react';

interface Customer {
    id: number; business_name: string; tax_id: string; address: string;
    phone: string; email: string; zip_code: string; city: string;
    state: string; tax_status: string;
}
interface State { id: number; name: string; }
interface City { id: number; name: string; state_id: number; }
interface Props { cliente: Customer; provincias: State[]; localidades: City[]; }

export default function Edit({ cliente, provincias, localidades }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        business_name: cliente.business_name,
        tax_id: cliente.tax_id?.toString() || '',
        address: cliente.address,
        phone: cliente.phone,
        email: cliente.email,
        zip_code: cliente.zip_code?.toString() || '',
        city: cliente.city,
        state: cliente.state,
        tax_status: cliente.tax_status || '',
    });

    const [selectedStateId, setSelectedStateId] = useState<string>(() => {
        const state = provincias.find(p => p.name === cliente.state);
        return state ? state.id.toString() : '';
    });

    const [filteredCities, setFilteredCities] = useState<City[]>(() => {
        const state = provincias.find(p => p.name === cliente.state);
        return state ? localidades.filter(c => c.state_id === state.id) : [];
    });

    useEffect(() => {
        if (selectedStateId) {
            const filtered = localidades.filter(c => c.state_id.toString() === selectedStateId);
            setFilteredCities(filtered);
            if (data.city && !filtered.find(c => c.name === data.city)) {
                setData('city', '');
            }
        } else {
            setFilteredCities([]);
            setData('city', '');
        }
    }, [selectedStateId]);

    const handleStateChange = (value: string) => {
        setSelectedStateId(value);
        setData('state', provincias.find(p => p.id.toString() === value)?.name || '');
        setData('city', '');
    };

    const submit = (e: React.FormEvent) => { e.preventDefault(); put(route('clientes.update', cliente.id)); };

    const provinciaOptions = provincias.map(p => ({ value: p.id.toString(), label: p.name }));
    const ciudadOptions = filteredCities.map(c => ({ value: c.name, label: c.name }));

    return (
        <AppLayout>
            <Head title="Editar Cliente" />
            <div className="p-6">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Editar Cliente</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Razón Social" htmlFor="business_name" error={errors.business_name} required>
                                    <Input id="business_name" value={data.business_name} onChange={(e) => setData('business_name', e.target.value)} error={errors.business_name} placeholder="Ej: Distribuidora Sur S.A." />
                                </FormField>
                                <FormField label="Documento" htmlFor="tax_id" error={errors.tax_id} required>
                                    <Input id="tax_id" value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value)} error={errors.tax_id} placeholder="20123456789" />
                                </FormField>
                                <FormField label="Dirección" htmlFor="address" error={errors.address} required>
                                    <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} placeholder="Ej: Av. Corrientes 1234" />
                                </FormField>
                                <FormField label="Teléfono" htmlFor="phone" error={errors.phone} required>
                                    <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} placeholder="Ej: 11 1234-5678" />
                                </FormField>
                                <FormField label="Email" htmlFor="email" error={errors.email}>
                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} placeholder="correo@empresa.com" />
                                </FormField>
                                <FormField label="Código Postal" htmlFor="zip_code">
                                    <Input id="zip_code" value={data.zip_code} onChange={(e) => setData('zip_code', e.target.value)} placeholder="Ej: 1043" />
                                </FormField>
                                <FormField label="Provincia" error={errors.state} required>
                                    <Combobox
                                        options={provinciaOptions}
                                        value={selectedStateId}
                                        onValueChange={handleStateChange}
                                        placeholder="Seleccionar provincia..."
                                        searchPlaceholder="Buscar provincia..."
                                        emptyMessage="No se encontró la provincia."
                                        error={errors.state}
                                    />
                                </FormField>
                                <FormField label="Localidad" error={errors.city} required>
                                    <Combobox
                                        options={ciudadOptions}
                                        value={data.city}
                                        onValueChange={(v) => setData('city', v)}
                                        placeholder="Seleccionar localidad..."
                                        searchPlaceholder="Buscar localidad..."
                                        emptyMessage="No se encontró la localidad."
                                        disabled={!selectedStateId}
                                        error={errors.city}
                                    />
                                </FormField>
                                <FormField label="Condición IVA" className="md:col-span-2">
                                    <Select value={data.tax_status} onValueChange={(v) => setData('tax_status', v)}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar condición IVA" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Responsable Inscripto">Responsable Inscripto</SelectItem>
                                            <SelectItem value="Monotributo">Monotributo</SelectItem>
                                            <SelectItem value="Exento">Exento</SelectItem>
                                            <SelectItem value="Consumidor Final">Consumidor Final</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormField>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>{processing ? 'Actualizando...' : 'Actualizar Cliente'}</Button>
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
