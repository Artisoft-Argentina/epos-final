import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Link } from '@inertiajs/react';

interface ListaPrecio {
    id: number;
    name: string;
    percentage: number;
    default_pos: boolean;
    default_ecommerce: boolean;
}

interface Props {
    lista: ListaPrecio;
}

export default function Edit({ lista }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: lista.name || '',
        percentage: Number(lista.percentage) || 0,
        default_pos: Boolean(lista.default_pos),
        default_ecommerce: Boolean(lista.default_ecommerce),
        regenerar_precios: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('listas-precios.update', lista.id));
    };

    return (
        <AppSidebarLayout>
            <Head title={`Editar ${lista.name}`} />
            
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href={route('listas-precios.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Editar Lista de Precios</h1>
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
                                        id="regenerar_precios"
                                        checked={data.regenerar_precios}
                                        onCheckedChange={(checked) => setData('regenerar_precios', !!checked)}
                                    />
                                    <Label htmlFor="regenerar_precios">Regenerar precios con nuevo porcentaje</Label>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Guardando...' : 'Guardar Cambios'}
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