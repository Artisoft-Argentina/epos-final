import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/form-field';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Save, User, Building2, Phone, MapPin, Receipt, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface Customer {
    id: number;
    business_name: string;
    fantasy_name: string | null;
    person_type: string;
    tax_id: string | null;
    dni: string | null;
    phone: string | null;
    cellphone: string | null;
    email: string | null;
    address: string | null;
    zip_code: string | null;
    city_id: number | null;
    state_id: number | null;
    tax_status: string;
    notes: string | null;
    active: boolean;
}

interface State { id: number; name: string; }
interface City { id: number; name: string; state_id: number; }
interface Props { customer: Customer; states: State[]; cities: City[]; }

const TAX_STATUS_OPTIONS = [
    'Responsable Inscripto',
    'Monotributo',
    'Exento',
    'Consumidor Final',
];

export default function Edit({ customer, states, cities }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        business_name: customer.business_name,
        fantasy_name: customer.fantasy_name ?? '',
        person_type: customer.person_type,
        tax_id: customer.tax_id ?? '',
        dni: customer.dni ?? '',
        phone: customer.phone ?? '',
        cellphone: customer.cellphone ?? '',
        email: customer.email ?? '',
        address: customer.address ?? '',
        zip_code: customer.zip_code ?? '',
        city_id: customer.city_id?.toString() ?? '',
        state_id: customer.state_id?.toString() ?? '',
        tax_status: customer.tax_status,
        notes: customer.notes ?? '',
        active: customer.active,
    });

    const [filteredCities, setFilteredCities] = useState<City[]>(() =>
        customer.state_id ? cities.filter((c) => c.state_id === customer.state_id) : []
    );

    useEffect(() => {
        if (data.state_id) {
            const filtered = cities.filter((c) => c.state_id.toString() === data.state_id);
            setFilteredCities(filtered);
            if (data.city_id && !filtered.find((c) => c.id.toString() === data.city_id)) {
                setData('city_id', '');
            }
        } else {
            setFilteredCities([]);
            setData('city_id', '');
        }
    }, [data.state_id]);

    const stateOptions = states.map((s) => ({ value: s.id.toString(), label: s.name }));
    const cityOptions = filteredCities.map((c) => ({ value: c.id.toString(), label: c.name }));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('customers.update', customer.id));
    };

    return (
        <AppLayout>
            <Head title="Editar Cliente" />
            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                            <Link href={route('customers.index')} className="hover:text-primary transition-colors">
                                Clientes
                            </Link>
                            <ChevronRight className="size-3.5" />
                            <span className="text-foreground font-medium">{customer.business_name}</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Editar Cliente</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Actualizá la información del cliente.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={route('customers.index')}>
                            <Button variant="outline">Cancelar</Button>
                        </Link>
                        <Button onClick={submit} disabled={processing}>
                            <Save className="size-4" />
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left column */}
                        <div className="lg:col-span-2 flex flex-col gap-6">

                            {/* Identity */}
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        {data.person_type === 'juridica'
                                            ? <Building2 className="size-4 text-primary" />
                                            : <User className="size-4 text-primary" />
                                        }
                                        Identificación
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>Tipo de Persona</Label>
                                        <div className="flex gap-6 pt-1">
                                            {(['fisica', 'juridica'] as const).map((type) => (
                                                <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                                                    <div className={cn(
                                                        'size-4 rounded-full border-2 flex items-center justify-center transition-colors',
                                                        data.person_type === type
                                                            ? 'border-primary bg-primary'
                                                            : 'border-input bg-card group-hover:border-primary/50'
                                                    )}>
                                                        {data.person_type === type && (
                                                            <div className="size-1.5 rounded-full bg-white" />
                                                        )}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="person_type"
                                                        value={type}
                                                        checked={data.person_type === type}
                                                        onChange={() => setData('person_type', type)}
                                                        className="sr-only"
                                                    />
                                                    <span className="text-sm font-medium text-foreground">
                                                        {type === 'fisica' ? 'Persona Física' : 'Persona Jurídica'}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <FormField label="Nombre / Razón Social" htmlFor="business_name" error={errors.business_name} required className="md:col-span-2">
                                        <Input id="business_name" value={data.business_name} onChange={(e) => setData('business_name', e.target.value)} placeholder={data.person_type === 'juridica' ? 'Ej. Empresa S.A.' : 'Ej. Juan Pérez'} error={errors.business_name} />
                                    </FormField>

                                    <FormField label="Nombre Fantasía" htmlFor="fantasy_name" error={errors.fantasy_name} className="md:col-span-2">
                                        <Input id="fantasy_name" value={data.fantasy_name} onChange={(e) => setData('fantasy_name', e.target.value)} placeholder="Nombre comercial (opcional)" error={errors.fantasy_name} />
                                    </FormField>

                                    {data.person_type === 'juridica' ? (
                                        <FormField label="CUIT / CUIL" htmlFor="tax_id" error={errors.tax_id} required>
                                            <Input id="tax_id" value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value.replace(/\D/g, '').slice(0, 13))} placeholder="Ej. 30123456789" error={errors.tax_id} />
                                        </FormField>
                                    ) : (
                                        <>
                                            <FormField label="DNI" htmlFor="dni" error={errors.dni} required>
                                                <Input id="dni" value={data.dni} onChange={(e) => setData('dni', e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Ej. 12345678" error={errors.dni} />
                                            </FormField>
                                            <FormField label="CUIT / CUIL" htmlFor="tax_id" error={errors.tax_id}>
                                                <Input id="tax_id" value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value.replace(/\D/g, '').slice(0, 13))} placeholder="Ej. 20123456789 (opcional)" error={errors.tax_id} />
                                            </FormField>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Contacto */}
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Phone className="size-4 text-primary" />
                                        Contacto
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Teléfono" htmlFor="phone" error={errors.phone}>
                                        <Input id="phone" type="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="Ej. 011 4444-5555" error={errors.phone} />
                                    </FormField>
                                    <FormField label="Celular" htmlFor="cellphone" error={errors.cellphone}>
                                        <Input id="cellphone" type="tel" value={data.cellphone} onChange={(e) => setData('cellphone', e.target.value)} placeholder="Ej. 11 15-2222-3333" error={errors.cellphone} />
                                    </FormField>
                                    <FormField label="Email" htmlFor="email" error={errors.email} className="md:col-span-2">
                                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="correo@ejemplo.com" error={errors.email} />
                                    </FormField>
                                </CardContent>
                            </Card>

                            {/* Domicilio */}
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <MapPin className="size-4 text-primary" />
                                        Domicilio
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Dirección" htmlFor="address" error={errors.address} className="md:col-span-2">
                                        <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} placeholder="Calle, Número, Piso, Depto" error={errors.address} />
                                    </FormField>
                                    <FormField label="Provincia" error={errors.state_id}>
                                        <Combobox options={stateOptions} value={data.state_id} onValueChange={(v) => setData('state_id', v)} placeholder="Seleccionar provincia..." searchPlaceholder="Buscar provincia..." emptyMessage="No se encontró la provincia." error={errors.state_id} />
                                    </FormField>
                                    <FormField label="Localidad" error={errors.city_id}>
                                        <Combobox options={cityOptions} value={data.city_id} onValueChange={(v) => setData('city_id', v)} placeholder="Seleccionar localidad..." searchPlaceholder="Buscar localidad..." emptyMessage="No se encontró la localidad." disabled={!data.state_id} error={errors.city_id} />
                                    </FormField>
                                    <FormField label="Código Postal" htmlFor="zip_code" error={errors.zip_code}>
                                        <Input id="zip_code" value={data.zip_code} onChange={(e) => setData('zip_code', e.target.value)} placeholder="Ej. 1000" error={errors.zip_code} />
                                    </FormField>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right column */}
                        <div className="flex flex-col gap-6">
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Receipt className="size-4 text-primary" />
                                        Fiscal
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5">
                                    <FormField label="Condición frente al IVA" error={errors.tax_status} required>
                                        <Select value={data.tax_status} onValueChange={(v) => setData('tax_status', v)}>
                                            <SelectTrigger className={errors.tax_status ? 'border-destructive' : ''}>
                                                <SelectValue placeholder="Seleccionar condición..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TAX_STATUS_OPTIONS.map((o) => (
                                                    <SelectItem key={o} value={o}>{o}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                </CardContent>
                            </Card>

                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <SlidersHorizontal className="size-4 text-primary" />
                                        Comercial
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5 flex flex-col gap-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Estado</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Habilita al cliente para operar</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={data.active ? 'success' : 'secondary'} dot>
                                                {data.active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                            <Switch checked={data.active} onCheckedChange={(v) => setData('active', v)} />
                                        </div>
                                    </div>
                                    <FormField label="Observaciones internas" htmlFor="notes" error={errors.notes}>
                                        <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Notas adicionales sobre el cliente..." rows={4} />
                                    </FormField>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Link href={route('customers.index')}>
                            <Button variant="outline">Cancelar</Button>
                        </Link>
                        <Button onClick={submit} disabled={processing}>
                            <Save className="size-4" />
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
