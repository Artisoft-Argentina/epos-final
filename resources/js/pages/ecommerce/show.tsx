import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CartProvider } from '@/contexts/CartContext';
import { ChevronLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

interface Articulo {
    id: number;
    articulo: string;
    descripcion?: string;
    precio: number;
    stock?: number;
    categoria?: { id: number; nombre: string };
    marca?: { nombre: string };
    imagenes?: Array<{
        id: number;
        ruta: string;
        url?: string;
    }>;
}

interface Props {
    articulo: Articulo;
    relacionados: Articulo[];
    cartCount: number;
}

function ProductShowContent({ articulo, relacionados, cartCount }: Props) {
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isAdding, setIsAdding] = useState(false);

    const addToCart = () => {
        setIsAdding(true);
        router.post(`/cart/${articulo.id}`, {
            quantity: quantity
        }, {
            preserveScroll: true,
            onSuccess: () => {
                window.location.reload();
            },
            onError: (errors) => {
                console.error('Error al agregar al carrito:', errors);
                setIsAdding(false);
            }
        });
    };

    const images = articulo.imagenes && articulo.imagenes.length > 0
        ? articulo.imagenes
        : [{ id: 0, ruta: '', url: '' }];

    return (
        <ShopLayout title={articulo.articulo} cartCount={cartCount}>
            <Head title={articulo.articulo} />

            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link
                        href="/shop"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-black"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Volver a la tienda
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Galería de imágenes */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-lg">
                            {images[selectedImage]?.url ? (
                                <img
                                    src={images[selectedImage].url}
                                    alt={articulo.articulo}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-gray-400">Sin imagen</span>
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {images.map((img, index) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setSelectedImage(index)}
                                        className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                                            selectedImage === index ? 'border-black' : 'border-transparent'
                                        }`}
                                    >
                                        {img.url ? (
                                            <img
                                                src={img.url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Información del producto */}
                    <div className="space-y-6">
                        {articulo.categoria && (
                            <p className="text-sm text-gray-500 uppercase tracking-wide">
                                {articulo.categoria.nombre}
                            </p>
                        )}

                        <h1 className="text-3xl font-bold text-black uppercase">
                            {articulo.articulo}
                        </h1>

                        {articulo.marca && (
                            <p className="text-sm text-gray-600">
                                Marca: <span className="font-medium">{articulo.marca.nombre}</span>
                            </p>
                        )}

                        <div className="text-3xl font-bold text-black">
                            ${Number(articulo.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>

                        {articulo.descripcion && (
                            <div className="prose prose-sm text-gray-600">
                                <p>{articulo.descripcion}</p>
                            </div>
                        )}

                        <div className="border-t pt-6 space-y-4">
                            {/* Selector de cantidad */}
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">Cantidad:</span>
                                <div className="flex items-center border rounded-lg">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-2 hover:bg-gray-100"
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="px-4 py-2 min-w-[3rem] text-center">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="p-2 hover:bg-gray-100"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Botón agregar al carrito */}
                            <Button
                                size="lg"
                                className="w-full bg-black hover:bg-gray-800"
                                onClick={addToCart}
                                disabled={isAdding}
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                {isAdding ? 'Agregando...' : 'Agregar al carrito'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Productos relacionados */}
                {relacionados.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold mb-8">PRODUCTOS RELACIONADOS</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {relacionados.map((prod) => (
                                <Link
                                    key={prod.id}
                                    href={`/shop/${prod.id}`}
                                    className="group"
                                >
                                    <div className="aspect-square bg-gray-100 mb-4 relative overflow-hidden rounded-lg">
                                        {prod.imagenes && prod.imagenes.length > 0 && prod.imagenes[0].url ? (
                                            <img
                                                src={prod.imagenes[0].url}
                                                alt={prod.articulo}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-gray-400 text-sm">Sin imagen</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-medium text-sm uppercase text-black">
                                        {prod.articulo}
                                    </h3>
                                    <p className="font-bold mt-1">
                                        ${Number(prod.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ShopLayout>
    );
}

export default function ProductShow(props: Props) {
    return (
        <CartProvider initialCartCount={props.cartCount}>
            <ProductShowContent {...props} />
        </CartProvider>
    );
}
