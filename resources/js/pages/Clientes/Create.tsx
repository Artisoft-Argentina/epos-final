import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/form-field';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface State { id: number; name: string; afip_id?: number; }
interface City { id: number; name: string; state_id: number; }
interface Props { provincias: State[]; localidades: City[]; }

export default function Create({ provincias, localidades }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        business_name: '', tax_id: '', address: '', phone: '',
        email: '', zip_code: '', city: '', state: '', tax_status: '',
    });

    const [selectedStateId, setSelectedStateId] = useState('');
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
        setData('state', provincias.find(p => p.id.toString() === value)?.name || '');
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
                setData({ ...data, business_name: result.razonsocial || data.business_name, address: result.direccion || data.address, city: result.localidad || data.city, zip_code: result.codigopostal || data.zip_code, tax_status: result.condicioniva || data.tax_status, state: result.provincia || data.state });
                if (result.provincia_id_afip !== null) {
                    const stateAfip = provincias.find(p => (p as any).afip_id === result.provincia_id_afip);
                    if (stateAfip) setSelectedStateId(stateAfip.id.toString());
                }
                toast.success('Datos cargados desde AFIP');
            } else {
                toast.error(result.error || 'No se pudieron obtener datos de AFIP');
            }
        } catch { toast.error('Error consultando AFIP'); }
        finally { setConsultandoAfip(false); }
    };

    const submit = (e: React.FormEvent) => { e.preventDefault(); post(route('clientes.store')); };

    const provinciaOptions = provincias.map(p => ({ value: p.id.toString(), label: p.name }));
    const ciudadOptions = filteredCities.map(c => ({ value: c.name, label: c.name }));

    return (
        <AppLayout>
            <Head title="Crear Cliente" />
            <div className="p-6">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Crear Nuevo Cliente</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Razón Social" htmlFor="business_name" error={errors.business_name} required>
                                    <Input id="business_name" value={data.business_name} onChange={(e) => setData('business_name', e.target.value)} error={errors.business_name} placeholder="Ej: Distribuidora Sur S.A." />
                                </FormField>
                                <FormField label="CUIT / DNI" htmlFor="tax_id" error={errors.tax_id} required>
                                    <div className="flex gap-2">
                                        <Input id="tax_id" placeholder="20123456789 o 12345678" value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value.replace(/\D/g, '').slice(0, 11))} maxLength={11} error={errors.tax_id} />
                                        <Button type="button" variant="outline" onClick={consultarAfip} disabled={!data.tax_id || consultandoAfip}>
                                            {consultandoAfip ? 'Consultando...' : 'AFIP'}
                                        </Button>
                                    </div>
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
                                <FormField label="Código Postal" htmlFor="zip_code" error={errors.zip_code}>
                                    <Input id="zip_code" value={data.zip_code} onChange={(e) => setData('zip_code', e.target.value)} error={errors.zip_code} placeholder="Ej: 1043" />
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
                                <Button type="submit" disabled={processing}>Crear</Button>
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
