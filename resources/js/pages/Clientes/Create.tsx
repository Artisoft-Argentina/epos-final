import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface State { id: number; name: string; afip_id?: number; }
interface City { id: number; name: string; state_id: number; }

interface Props {
    provincias: State[];
    localidades: City[];
}

export default function Create({ provincias, localidades }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        business_name: '',
        tax_id: '',
        address: '',
        phone: '',
        email: '',
        zip_code: '',
        city: '',
        state: '',
        tax_status: '',
    });

    const [selectedStateId, setSelectedStateId] = useState<string>('');
    const [filteredCities, setFilteredCities] = useState<City[]>([]);
    const [consultandoAfip, setConsultandoAfip] = useState(false);

    useEffect(() => {
        if (selectedStateId) {
            setFilteredCities(localidades.filter(c => c.state_id.toString() === selectedStateId));
        } else {
            setFilteredCities([]);
        }
        setData('city', '');
    }, [selectedStateId]);

    const handleStateChange = (value: string) => {
        setSelectedStateId(value);
        const state = provincias.find(p => p.id.toString() === value);
        setData('state', state?.name || '');
    };

    const consultarAfip = async () => {
        if (!data.tax_id) { toast.error('Ingrese un CUIT o DNI'); return; }
        setConsultandoAfip(true);
        try {
            const response = await fetch(route('afip.consultar-cuit'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ cuit: data.tax_id }),
            });
            const result = await response.json();
            if (result) {
                setData({
                    ...data,
                    business_name: result.razonsocial || data.business_name,
                    address: result.direccion || data.address,
                    city: result.localidad || data.city,
                    zip_code: result.codigopostal || data.zip_code,
                    tax_status: result.condicioniva || data.tax_status,
                    state: result.provincia || data.state,
                });
                if (result.provincia_id_afip !== null) {
                    const stateAfip = provincias.find(p => (p as any).afip_id === result.provincia_id_afip);
                    if (stateAfip) setSelectedStateId(stateAfip.id.toString());
                }
                toast.success('Datos cargados desde AFIP');
            } else {
                toast.error(result.error || 'No se pudieron obtener datos de AFIP');
            }
        } catch {
            toast.error('Error consultando AFIP');
        } finally {
            setConsultandoAfip(false);
        }
    };

    const submit = (e: React.FormEvent) => { e.preventDefault(); post(route('clientes.store')); };

    return (
        <AppLayout>
            <Head title="Crear Cliente" />
            <Card className="max-w-2xl">
                <CardHeader><CardTitle>Crear Nuevo Cliente</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="business_name">Razón Social *</Label>
                                <Input id="business_name" value={data.business_name} onChange={(e) => setData('business_name', e.target.value)} error={errors.business_name} />
                            </div>
                            <div>
                                <Label htmlFor="tax_id">CUIT / DNI *</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="tax_id"
                                        placeholder="20123456789 o 12345678"
                                        value={data.tax_id}
                                        onChange={(e) => setData('tax_id', e.target.value.replace(/\D/g, '').slice(0, 11))}
                                        error={errors.tax_id}
                                        maxLength={11}
                                    />
                                    <Button type="button" variant="outline" onClick={consultarAfip} disabled={!data.tax_id || consultandoAfip}>
                                        {consultandoAfip ? 'Consultando...' : 'AFIP'}
                                    </Button>
                                </div>
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
                                <Input id="zip_code" value={data.zip_code} onChange={(e) => setData('zip_code', e.target.value)} error={errors.zip_code} />
                            </div>
                            <div>
                                <Label htmlFor="state">Provincia *</Label>
                                <Select value={selectedStateId} onValueChange={handleStateChange}>
                                    <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Seleccionar provincia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provincias.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.state && <p className="text-sm text-red-600 mt-1">{errors.state}</p>}
                            </div>
                            <div>
                                <Label htmlFor="city">Localidad *</Label>
                                <Select value={data.city} onValueChange={(value) => setData('city', value)} disabled={!selectedStateId}>
                                    <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Seleccionar localidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredCities.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="tax_status">Condición IVA</Label>
                                <Select value={data.tax_status} onValueChange={(value) => setData('tax_status', value)}>
                                    <SelectTrigger className={errors.tax_status ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Seleccionar condición IVA" />
                                    </SelectTrigger>
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
                            <Button type="submit" disabled={processing}>Crear</Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
