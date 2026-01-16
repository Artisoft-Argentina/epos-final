import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface PdfResult {
    tipo_documento: string;
    numero: string;
    fecha: string;
    proveedor: {
        nombre: string;
        cuit: string;
        direccion: string;
        telefono: string;
    };
    items: Array<{
        codigo: string;
        descripcion: string;
        cantidad: number;
        precio_unitario: number;
        subtotal: number;
    }>;
    subtotal: number;
    iva: number;
    total: number;
}

export default function AsistenteComprasIndex() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PdfResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const response = await fetch('/asistente-compras/process', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: formData,
            });

            const data = await response.json();
            
            if (data.success) {
                setResult(data.data);
            } else {
                setError(data.error || 'Error al procesar el PDF');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error al procesar el PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Asistente Compras" />
            <div className="p-6 max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Asistente de Compras</h1>
                    <p className="text-muted-foreground mt-2">
                        Sube un PDF de factura o remito para procesarlo automáticamente
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <div className="space-y-6">
                            <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="pdf-upload"
                                />
                                <label htmlFor="pdf-upload" className="cursor-pointer">
                                    <div className="flex flex-col items-center gap-2">
                                        {file ? (
                                            <>
                                                <FileText className="w-12 h-12 text-primary" />
                                                <p className="font-medium">{file.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-12 h-12 text-muted-foreground" />
                                                <p className="font-medium">Haz clic para subir un PDF</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Máximo 10MB
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </label>
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    'Procesar PDF'
                                )}
                            </Button>

                            {error && (
                                <Card className="p-4 bg-destructive/10 border-destructive">
                                    <div className="flex items-center gap-2 text-destructive">
                                        <XCircle className="w-5 h-5" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </Card>

                    {result && (
                        <Card className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-600 mb-4">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <h3 className="font-semibold">Documento procesado</h3>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tipo</p>
                                        <p className="font-medium capitalize">{result.tipo_documento}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Número</p>
                                        <p className="font-medium">{result.numero}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Fecha</p>
                                        <p className="font-medium">{result.fecha}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Proveedor</p>
                                        <p className="font-medium">{result.proveedor?.nombre}</p>
                                        {result.proveedor?.cuit && (
                                            <p className="text-sm">CUIT: {result.proveedor.cuit}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Items ({result.items?.length || 0})</p>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {result.items?.map((item, i) => (
                                                <div key={i} className="text-sm border-l-2 pl-2">
                                                    <p className="font-medium">{item.descripcion}</p>
                                                    <p className="text-muted-foreground">
                                                        {item.cantidad} x ${item.precio_unitario} = ${item.subtotal}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t">
                                        <div className="flex justify-between">
                                            <p className="text-sm">Subtotal</p>
                                            <p className="font-medium">${result.subtotal}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <p className="text-sm">IVA</p>
                                            <p className="font-medium">${result.iva}</p>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold">
                                            <p>Total</p>
                                            <p>${result.total}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
