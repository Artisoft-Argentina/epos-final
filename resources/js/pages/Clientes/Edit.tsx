import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface Customer {
    id: number; business_name: string; tax_id: string; address: string;
    phone: string; email: string; zip_code: string; city: string;
    state: string; tax_status: string;
}
interface State { id: number; name: string; }
interface City { id: number; name: string; state_id: number; }

interface Props {
    cliente: Customer;
    provincias: State[];
    localidades: City[];
}

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

    const [selectedCity, setSelectedCity] = useState<string>(cliente.city);

    const [filteredCities, setFilteredCities] = useState<City[]>(() => {
        const state = provincias.find(p => p.name === cliente.state);
        return state ? localidades.filter(c => c.state_id === state.id) : [];
    });

    useEffect(() => {
        if (selectedStateId) {
            const filtered = localidades.filter(c => c.state_id.toString() === selectedStateId);
            setFilteredCities(filtered);
            if (selectedCity && !filtered.find(c => c.name === selectedCity)) {
                setSelectedCity('');
                setData('city', '');
            }
        } else {
            setFilteredCities([]);
            setSelectedCity('');
            setData('city', '');
        }
    }, [selectedStateId, localidades]);

    const handleStateChange = (value: string) => {
        setSelectedStateId(value);
        const state = provincias.find(p => p.id.toString() === value);
        setData('state', state?.name || '');
        setData('city', '');
    };

    const submit = (e: React.FormEvent) => { e.preventDefault(); put(route('clientes.update', cliente.id)); };

    return (
        <AppLayout>
            <Head title="Editar Cliente" />
            <Card className="max-w-2xl">
                <CardHeader><CardTitle>Editar Cliente</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="business_name">Razón Social *</Label>
                                <Input id="business_name" value={data.business_name} onChange={(e) => setData('business_name', e.target.value)} error={errors.business_name} />
                            </div>
                            <div>
                                <Label htmlFor="tax_id">Documento *</Label>
                                <Input id="tax_id" value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value)} error={errors.tax_id} />
                            </div>
                            <div>
                                <Label htmlFor="address">Dirección *</Label>
                                <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                            </div>
                            <div>
                                <Label htmlFor="phone">Teléfono *</Label>
                                <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                            </div>
                            <div>
                                <Label htmlFor="zip_code">Código Postal</Label>
                                <Input id="zip_code" value={data.zip_code} onChange={(e) => setData('zip_code', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="state">Provincia *</Label>
                                <Select value={selectedStateId} onValueChange={handleStateChange}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar provincia" /></SelectTrigger>
                                    <SelectContent>
                                        {provincias.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="city">Localidad *</Label>
                                <Select value={selectedCity} onValueChange={(value) => { setSelectedCity(value); setData('city', value); }} disabled={!selectedStateId}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar localidad" /></SelectTrigger>
                                    <SelectContent>
                                        {filteredCities.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="tax_status">Condición IVA</Label>
                                <Select value={data.tax_status} onValueChange={(value) => setData('tax_status', value)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar condición IVA" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Responsable Inscripto">Responsable Inscripto</SelectItem>
                                        <SelectItem value="Monotributo">Monotributo</SelectItem>
                                        <SelectItem value="Exento">Exento</SelectItem>
                                        <SelectItem value="Consumidor Final">Consumidor Final</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>{processing ? 'Actualizando...' : 'Actualizar Cliente'}</Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
