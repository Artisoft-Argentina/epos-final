import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';

interface Empresa {
    id?: number;
    cuit?: number;
    razonsocial?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    codigopostal?: number;
    localidad?: string;
    provincia?: string;
    condicioniva?: string;
    iibb?: string;
    inicioactividades?: string;
    puntoventa?: number;
    afip_ambiente?: string;
    nombrefantasia?: string;
    domiciliocomercial?: string;
    tagline?: string;
    logo?: string;
    numfactura?: number;
    numremito?: number;
    numpresupuesto?: number;
    numpago?: number;
    numrecibo?: number;
}

interface Props {
    empresa: Empresa;
}

export default function Index({ empresa }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        cuit: empresa.cuit || '',
        razonsocial: empresa.razonsocial || '',
        direccion: empresa.direccion || '',
        telefono: empresa.telefono || '',
        email: empresa.email || '',
        codigopostal: empresa.codigopostal || '',
        localidad: empresa.localidad || '',
        provincia: empresa.provincia || '',
        condicioniva: empresa.condicioniva || '',
        iibb: empresa.iibb || '',
        inicioactividades: empresa.inicioactividades || '',
        puntoventa: empresa.puntoventa || '',
        afip_ambiente: empresa.afip_ambiente || 'homologacion',
        nombrefantasia: empresa.nombrefantasia || '',
        domiciliocomercial: empresa.domiciliocomercial || '',
        tagline: empresa.tagline || '',
        logo: null as File | null,
        numfactura: empresa.numfactura || '',
        numremito: empresa.numremito || '',
        numpresupuesto: empresa.numpresupuesto || '',
        numpago: empresa.numpago || '',
        numrecibo: empresa.numrecibo || '',
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
                                <Label htmlFor="cuit">CUIT</Label>
                                <Input
                                    id="cuit"
                                    type="number"
                                    value={data.cuit}
                                    onChange={(e) => setData('cuit', e.target.value)}
                                    error={errors.cuit}
                                />
                            </div>
                            <div>
                                <Label htmlFor="razonsocial">Razón Social</Label>
                                <Input
                                    id="razonsocial"
                                    value={data.razonsocial}
                                    onChange={(e) => setData('razonsocial', e.target.value)}
                                    error={errors.razonsocial}
                                />
                            </div>
                            <div>
                                <Label htmlFor="nombrefantasia">Nombre de Fantasía</Label>
                                <Input
                                    id="nombrefantasia"
                                    value={data.nombrefantasia}
                                    onChange={(e) => setData('nombrefantasia', e.target.value)}
                                    error={errors.nombrefantasia}
                                />
                            </div>
                            <div>
                                <Label htmlFor="condicioniva">Condición IVA</Label>
                                <Select value={data.condicioniva} onValueChange={(value) => setData('condicioniva', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar condición" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Responsable Inscripto">Responsable Inscripto</SelectItem>
                                        <SelectItem value="Monotributo">Monotributo</SelectItem>
                                        <SelectItem value="Exento">Exento</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="iibb">Nº Ingresos Brutos</Label>
                                <Input
                                    id="iibb"
                                    value={data.iibb}
                                    onChange={(e) => setData('iibb', e.target.value)}
                                    placeholder="Ej: 123-456789-0"
                                />
                            </div>
                            <div>
                                <Label htmlFor="inicioactividades">Inicio de Actividades</Label>
                                <Input
                                    id="inicioactividades"
                                    value={data.inicioactividades}
                                    onChange={(e) => setData('inicioactividades', e.target.value)}
                                    placeholder="Ej: 01/01/2020"
                                />
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
                                <Label htmlFor="direccion">Dirección</Label>
                                <Input
                                    id="direccion"
                                    value={data.direccion}
                                    onChange={(e) => setData('direccion', e.target.value)}
                                    error={errors.direccion}
                                />
                            </div>
                            <div>
                                <Label htmlFor="domiciliocomercial">Domicilio Comercial</Label>
                                <Input
                                    id="domiciliocomercial"
                                    value={data.domiciliocomercial}
                                    onChange={(e) => setData('domiciliocomercial', e.target.value)}
                                    error={errors.domiciliocomercial}
                                />
                            </div>
                            <div>
                                <Label htmlFor="telefono">Teléfono</Label>
                                <Input
                                    id="telefono"
                                    value={data.telefono}
                                    onChange={(e) => setData('telefono', e.target.value)}
                                    error={errors.telefono}
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                />
                            </div>
                            <div>
                                <Label htmlFor="localidad">Localidad</Label>
                                <Input
                                    id="localidad"
                                    value={data.localidad}
                                    onChange={(e) => setData('localidad', e.target.value)}
                                    error={errors.localidad}
                                />
                            </div>
                            <div>
                                <Label htmlFor="codigopostal">Código Postal</Label>
                                <Input
                                    id="codigopostal"
                                    type="number"
                                    value={data.codigopostal}
                                    onChange={(e) => setData('codigopostal', e.target.value)}
                                    error={errors.codigopostal}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Numeración</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="puntoventa">Punto de Venta</Label>
                                <Input
                                    id="puntoventa"
                                    type="number"
                                    value={data.puntoventa}
                                    onChange={(e) => setData('puntoventa', e.target.value)}
                                    error={errors.puntoventa}
                                />
                            </div>
                            <div>
                                <Label htmlFor="numfactura">Próxima Factura</Label>
                                <Input
                                    id="numfactura"
                                    type="number"
                                    value={data.numfactura}
                                    onChange={(e) => setData('numfactura', e.target.value)}
                                    error={errors.numfactura}
                                />
                            </div>
                            <div>
                                <Label htmlFor="numremito">Próximo Remito</Label>
                                <Input
                                    id="numremito"
                                    type="number"
                                    value={data.numremito}
                                    onChange={(e) => setData('numremito', e.target.value)}
                                    error={errors.numremito}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración AFIP/ARCA</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="afip_ambiente">Ambiente AFIP</Label>
                                <Select value={data.afip_ambiente} onValueChange={(value) => setData('afip_ambiente', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar ambiente" />
                                    </SelectTrigger>
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