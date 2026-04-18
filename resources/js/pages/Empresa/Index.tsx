import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';

interface Empresa {
    id?: number;
    tax_id?: number;
    business_name?: string;
    address?: string;
    phone?: string;
    email?: string;
    zip_code?: number;
    city?: string;
    state?: string;
    tax_status?: string;
    gross_income_tax?: string;
    activity_start_date?: string;
    pos_number?: number;
    afip_environment?: string;
    trade_name?: string;
    commercial_address?: string;
    tagline?: string;
    logo?: string;
    next_invoice_number?: number;
    next_order_number?: number;
    next_quote_number?: number;
    next_payment_number?: number;
    next_receipt_number?: number;
}

interface Props {
    empresa: Empresa;
}

export default function Index({ empresa }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        tax_id: empresa.tax_id || '',
        business_name: empresa.business_name || '',
        address: empresa.address || '',
        phone: empresa.phone || '',
        email: empresa.email || '',
        zip_code: empresa.zip_code || '',
        city: empresa.city || '',
        state: empresa.state || '',
        tax_status: empresa.tax_status || '',
        gross_income_tax: empresa.gross_income_tax || '',
        activity_start_date: empresa.activity_start_date || '',
        pos_number: empresa.pos_number || '',
        afip_environment: empresa.afip_environment || 'homologacion',
        trade_name: empresa.trade_name || '',
        commercial_address: empresa.commercial_address || '',
        tagline: empresa.tagline || '',
        logo: null as File | null,
        next_invoice_number: empresa.next_invoice_number || '',
        next_order_number: empresa.next_order_number || '',
        next_quote_number: empresa.next_quote_number || '',
        next_payment_number: empresa.next_payment_number || '',
        next_receipt_number: empresa.next_receipt_number || '',
        cert_file: null as File | null,
        key_file: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('empresa.store'), {
            forceFormData: true
        });
    };

    return (
        <AppSidebarLayout>
            <Head title="Configuración de Empresa" />
            
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Configuración de Empresa</h1>
                    <p className="text-gray-600">Gestiona los datos de tu empresa</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos Generales</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="tax_id">CUIT</Label>
                                <Input id="tax_id" type="number" value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value)} error={errors.tax_id} />
                            </div>
                            <div>
                                <Label htmlFor="business_name">Razón Social</Label>
                                <Input id="business_name" value={data.business_name} onChange={(e) => setData('business_name', e.target.value)} error={errors.business_name} />
                            </div>
                            <div>
                                <Label htmlFor="trade_name">Nombre de Fantasía</Label>
                                <Input id="trade_name" value={data.trade_name} onChange={(e) => setData('trade_name', e.target.value)} error={errors.trade_name} />
                            </div>
                            <div>
                                <Label htmlFor="tax_status">Condición IVA</Label>
                                <Select value={data.tax_status} onValueChange={(value) => setData('tax_status', value)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar condición" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Responsable Inscripto">Responsable Inscripto</SelectItem>
                                        <SelectItem value="Monotributo">Monotributo</SelectItem>
                                        <SelectItem value="Exento">Exento</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="gross_income_tax">Nº Ingresos Brutos</Label>
                                <Input id="gross_income_tax" value={data.gross_income_tax} onChange={(e) => setData('gross_income_tax', e.target.value)} placeholder="Ej: 123-456789-0" />
                            </div>
                            <div>
                                <Label htmlFor="activity_start_date">Inicio de Actividades</Label>
                                <Input id="activity_start_date" value={data.activity_start_date} onChange={(e) => setData('activity_start_date', e.target.value)} placeholder="Ej: 01/01/2020" />
                            </div>
                            <div>
                                <Label htmlFor="logo">Logo</Label>
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('logo', e.target.files?.[0] || null)}
                                    error={errors.logo}
                                />
                                {empresa.logo && (
                                    <div className="mt-2">
                                        <img 
                                            src={`/storage/${empresa.logo}`} 
                                            alt="Logo actual" 
                                            className="h-16 w-auto object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="address">Dirección</Label>
                                <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                            </div>
                            <div>
                                <Label htmlFor="commercial_address">Domicilio Comercial</Label>
                                <Input id="commercial_address" value={data.commercial_address} onChange={(e) => setData('commercial_address', e.target.value)} error={errors.commercial_address} />
                            </div>
                            <div>
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                            </div>
                            <div>
                                <Label htmlFor="city">Localidad</Label>
                                <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} error={errors.city} />
                            </div>
                            <div>
                                <Label htmlFor="zip_code">Código Postal</Label>
                                <Input id="zip_code" type="number" value={data.zip_code} onChange={(e) => setData('zip_code', e.target.value)} error={errors.zip_code} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Numeración</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="pos_number">Punto de Venta</Label>
                                <Input id="pos_number" type="number" value={data.pos_number} onChange={(e) => setData('pos_number', e.target.value)} error={errors.pos_number} />
                            </div>
                            <div>
                                <Label htmlFor="next_invoice_number">Próxima Factura</Label>
                                <Input id="next_invoice_number" type="number" value={data.next_invoice_number} onChange={(e) => setData('next_invoice_number', e.target.value)} error={errors.next_invoice_number} />
                            </div>
                            <div>
                                <Label htmlFor="next_order_number">Próxima Orden</Label>
                                <Input id="next_order_number" type="number" value={data.next_order_number} onChange={(e) => setData('next_order_number', e.target.value)} error={errors.next_order_number} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración AFIP/ARCA</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="afip_environment">Ambiente AFIP</Label>
                                <Select value={data.afip_environment} onValueChange={(value) => setData('afip_environment', value)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar ambiente" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="homologacion">Homologación (Pruebas)</SelectItem>
                                        <SelectItem value="production">Producción</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">Usa Homologación para pruebas, Producción para facturas reales</p>
                            </div>
                            <div className="md:col-span-2 border-t pt-4 mt-2">
                                <p className="text-sm font-medium mb-3">Certificados Digitales</p>
                            </div>
                            <div>
                                <Label htmlFor="cert_file">Certificado AFIP (.pem, .crt, .txt)</Label>
                                <Input
                                    id="cert_file"
                                    type="file"
                                    accept=".pem,.crt,.cert,.txt"
                                    onChange={(e) => setData('cert_file', e.target.files?.[0] || null)}
                                />
                                <p className="text-xs text-gray-500 mt-1">Sube tu certificado AFIP para autorizar facturas</p>
                            </div>
                            <div>
                                <Label htmlFor="key_file">Clave Privada AFIP (.pem, .key, .txt)</Label>
                                <Input
                                    id="key_file"
                                    type="file"
                                    accept=".pem,.key,.txt"
                                    onChange={(e) => setData('key_file', e.target.files?.[0] || null)}
                                />
                                <p className="text-xs text-gray-500 mt-1">Sube tu clave privada AFIP correspondiente al certificado</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar Configuración'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppSidebarLayout>
    );
}