import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';
import CodigoDisplay from '@/components/CodigoDisplay';
import { Save, X } from 'lucide-react';

interface Articulo {
    id: number;
    codarticulo: string;
    articulo: string;
    descripcion: string;
    medida: string;
    precio: number;
    alicuota: number;
    stockminimo: number;
    marca_id: number;
    categoria_id: number;
    supplier_id?: number;
    codprov?: string;
    imagenes?: Array<{
        id: number;
        ruta: string;
        url: string;
        url_thumb?: string;
    }>;
}

interface Categoria {
    id: number;
    categoria: string;
}

interface Marca {
    id: number;
    marca: string;
}

interface Supplier {
    id: number;
    razonsocial: string;
}

interface Props {
    articulo: Articulo;
    categorias: Categoria[];
    marcas: Marca[];
    suppliers: Supplier[];
}

export default function Edit({ articulo, categorias, marcas, suppliers }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        codarticulo: articulo.codarticulo,
        articulo: articulo.articulo,
        descripcion: articulo.descripcion,
        medida: articulo.medida,
        precio: articulo.precio.toString(),
        alicuota: articulo.alicuota.toString(),
        stockminimo: articulo.stockminimo.toString(),
        marca_id: articulo.marca_id.toString(),
        categoria_id: articulo.categoria_id.toString(),
        supplier_id: articulo.supplier_id?.toString() || '',
        codprov: articulo.codprov || '',
        imagenes: [] as File[],
        _method: 'PUT'
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('articulos.update', articulo.id), {
            forceFormData: true
        });
    };

    const deleteImage = (imageId: number) => {
        if (confirm('¿Estás seguro de eliminar esta imagen?')) {
            router.delete(route('articulos.imagenes.destroy', imageId));
        }
    };

    return (
        <AppLayout>
            <Head title="Editar Artículo" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Editar Artículo</CardTitle>
                        </CardHeader>
                        <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="codarticulo">Código Artículo *</Label>
                                <Input
                                    id="codarticulo"
                                    value={data.codarticulo}
                                    onChange={(e) => setData('codarticulo', e.target.value)}
                                    error={errors.codarticulo}
                                />
                            </div>
                            <div>
                                <Label htmlFor="codprov">Código Proveedor</Label>
                                <Input
                                    id="codprov"
                                    value={data.codprov}
                                    onChange={(e) => setData('codprov', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="articulo">Artículo *</Label>
                                <Input
                                    id="articulo"
                                    value={data.articulo}
                                    onChange={(e) => setData('articulo', e.target.value)}
                                    error={errors.articulo}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="descripcion">Descripción *</Label>
                                <Input
                                    id="descripcion"
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    error={errors.descripcion}
                                />
                            </div>
                            <div>
                                <Label htmlFor="medida">Medida *</Label>
                                <Select value={data.medida} onValueChange={(value) => setData('medida', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Unidad">Unidad</SelectItem>
                                        <SelectItem value="Kg">Kg</SelectItem>
                                        <SelectItem value="Litro">Litro</SelectItem>
                                        <SelectItem value="Metro">Metro</SelectItem>
                                        <SelectItem value="Caja">Caja</SelectItem>
                                        <SelectItem value="Pack">Pack</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.medida && <p className="text-sm text-red-600 mt-1">{errors.medida}</p>}
                            </div>
                            <div>
                                <Label htmlFor="precio">Precio *</Label>
                                <Input
                                    id="precio"
                                    type="number"
                                    step="0.01"
                                    value={data.precio}
                                    onChange={(e) => setData('precio', e.target.value)}
                                    error={errors.precio}
                                />
                            </div>
                            <div>
                                <Label htmlFor="alicuota">Alícuota *</Label>
                                <Input
                                    id="alicuota"
                                    type="number"
                                    step="0.01"
                                    value={data.alicuota}
                                    onChange={(e) => setData('alicuota', e.target.value)}
                                    error={errors.alicuota}
                                />
                            </div>
                            <div>
                                <Label htmlFor="stockminimo">Stock Mínimo *</Label>
                                <Input
                                    id="stockminimo"
                                    type="number"
                                    value={data.stockminimo}
                                    onChange={(e) => setData('stockminimo', e.target.value)}
                                    error={errors.stockminimo}
                                />
                            </div>
                            <div>
                                <Label htmlFor="categoria_id">Categoría *</Label>
                                <Select value={data.categoria_id} onValueChange={(value) => setData('categoria_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categorias.map((categoria) => (
                                            <SelectItem key={categoria.id} value={categoria.id.toString()}>
                                                {categoria.categoria}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.categoria_id && <p className="text-sm text-red-600 mt-1">{errors.categoria_id}</p>}
                            </div>
                            <div>
                                <Label htmlFor="marca_id">Marca *</Label>
                                <Select value={data.marca_id} onValueChange={(value) => setData('marca_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar marca" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {marcas.map((marca) => (
                                            <SelectItem key={marca.id} value={marca.id.toString()}>
                                                {marca.marca}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.marca_id && <p className="text-sm text-red-600 mt-1">{errors.marca_id}</p>}
                            </div>
                            <div>
                                <Label htmlFor="supplier_id">Proveedor</Label>
                                <Select value={data.supplier_id} onValueChange={(value) => setData('supplier_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar proveedor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                {supplier.razonsocial}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.supplier_id && <p className="text-sm text-red-600 mt-1">{errors.supplier_id}</p>}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="descripcion">Descripción *</Label>
                            <Textarea 
                                id="descripcion" 
                                value={data.descripcion} 
                                onChange={(e) => setData('descripcion', e.target.value)} 
                                required 
                            />
                            <InputError message={errors.descripcion} />
                        </div>

                        {/* Imágenes existentes */}
                        {articulo.imagenes && articulo.imagenes.length > 0 && (
                            <div>
                                <Label>Imágenes actuales</Label>
                                <div className="grid grid-cols-4 gap-4 mt-2">
                                    {articulo.imagenes.map((image) => (
                                        <div key={image.id} className="relative">
                                            <img
                                                src={image.url_thumb || image.url}
                                                alt={articulo.articulo}
                                                className="w-full h-24 object-cover rounded border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => deleteImage(image.id)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Agregar nuevas imágenes */}
                        <div>
                            <Label htmlFor="imagenes">Agregar nuevas imágenes</Label>
                            <Input 
                                id="imagenes" 
                                type="file" 
                                multiple 
                                accept="image/*"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setData('imagenes', files);
                                }}
                            />
                            <p className="text-sm text-gray-500 mt-1">Puedes seleccionar múltiples imágenes (JPEG, PNG, JPG, GIF - Máx 5MB cada una). Las imágenes se redimensionan automáticamente.</p>
                            <InputError message={errors.imagenes} />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Actualizando...' : 'Actualizar Artículo'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancelar
                            </Button>
                        </div>
                    </form>
                        </CardContent>
                    </Card>
                </div>
                
                <div>
                    <CodigoDisplay 
                        articuloId={articulo.id} 
                        articuloNombre={articulo.articulo} 
                    />
                </div>
            </div>
        </AppLayout>
    );
}