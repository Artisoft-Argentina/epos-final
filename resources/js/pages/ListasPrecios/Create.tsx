import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Link } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        percentage: 0,
        default_pos: false,
        default_ecommerce: false,
        generar_precios: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('listas-precios.store'));
    };

    return (
        <AppSidebarLayout>
            <Head title="Nueva Lista de Precios" />
            
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={route('listas-precios.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Nueva Lista de Precios</h1>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Información de la Lista</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="percentage">Porcentaje de Incremento (%)</Label>
                                <Input
                                    id="percentage"
                                    type="number"
                                    step="0.01"
                                    value={data.percentage}
                                    onChange={(e) => setData('percentage', parseFloat(e.target.value) || 0)}
                                    className={errors.percentage ? 'border-red-500' : ''}
                                />
                                {errors.percentage && <p className="text-red-500 text-sm mt-1">{errors.percentage}</p>}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="default_pos"
                                        checked={data.default_pos}
                                        onCheckedChange={(checked) => setData('default_pos', !!checked)}
                                    />
                                    <Label htmlFor="default_pos">Lista por defecto para POS</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="default_ecommerce"
                                        checked={data.default_ecommerce}
                                        onCheckedChange={(checked) => setData('default_ecommerce', !!checked)}
                                    />
                                    <Label htmlFor="default_ecommerce">Lista por defecto para E-commerce</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="generar_precios"
                                        checked={data.generar_precios}
                                        onCheckedChange={(checked) => setData('generar_precios', !!checked)}
                                    />
                                    <Label htmlFor="generar_precios">Generar precios automáticamente</Label>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Guardando...' : 'Guardar'}
                                </Button>
                                <Link href={route('listas-precios.index')}>
                                    <Button variant="outline" type="button">
                                        Cancelar
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}