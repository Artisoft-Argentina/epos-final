import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CartProvider } from '@/contexts/CartContext';
import { ChevronLeft, Minus, Plus, ShoppingCart, Sparkles, Check, Truck, Shield, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface Articulo {
    id: number;
    name: string;
    description?: string;
    price: number;
    stock?: { quantity: number } | number;
    category?: { id: number; name: string } | null;
    brand?: { id: number; name: string } | null;
    images?: Array<{
        id: number;
        path: string;
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
    const [addedToCart, setAddedToCart] = useState(false);

    const addToCart = () => {
        setIsAdding(true);
        router.post(`/cart/${articulo.id}`, {
            quantity: quantity
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setAddedToCart(true);
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            },
            onError: (errors) => {
                console.error('Error al agregar al carrito:', errors);
                setIsAdding(false);
            }
        });
    };

    const images = articulo.images && articulo.images.length > 0
        ? articulo.images
        : [{ id: 0, path: '', url: '' }];

    return (
        <ShopLayout title={articulo.name} cartCount={cartCount}>
            <Head title={articulo.name} />

            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-8">
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Volver a la tienda</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl relative overflow-hidden shadow-lg">
                            {images[selectedImage]?.url ? (
                                <img
                                    src={images[selectedImage].url}
                                    alt={articulo.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                                            <Sparkles className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <span className="text-gray-400">Sin imagen</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((img, index) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setSelectedImage(index)}
                                        className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200 ${
                                            selectedImage === index
                                                ? 'ring-2 ring-violet-600 ring-offset-2 shadow-lg'
                                                : 'opacity-70 hover:opacity-100'
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

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Category Badge */}
                        {articulo.category && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                                {articulo.category.name}
                            </span>
                        )}

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            {articulo.name}
                        </h1>

                        {/* Brand */}
                        {articulo.brand && (
                            <p className="text-gray-500">
                                por <span className="font-medium text-gray-700">{articulo.brand.name}</span>
                            </p>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                ${Number(articulo.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Description */}
                        {articulo.description && (
                            <div className="prose prose-gray max-w-none">
                                <p className="text-gray-600 leading-relaxed">{articulo.description}</p>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="border-t border-gray-200 pt-6">
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-sm font-medium text-gray-700">Cantidad:</span>
                                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 rounded-lg hover:bg-white hover:shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <span className="px-4 py-2 min-w-[3rem] text-center font-semibold text-gray-900">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 rounded-lg hover:bg-white hover:shadow-sm transition-all flex items-center justify-center"
                                    >
                                        <Plus className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            <Button
                                size="lg"
                                className={`w-full rounded-xl py-6 text-lg font-semibold transition-all duration-300 ${
                                    addedToCart
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300'
                                }`}
                                onClick={addToCart}
                                disabled={isAdding}
                            >
                                {addedToCart ? (
                                    <>
                                        <Check className="w-5 h-5 mr-2" />
                                        Agregado al carrito
                                    </>
                                ) : isAdding ? (
                                    <>
                                        <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Agregando...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5 mr-2" />
                                        Agregar al carrito
                                    </>
                                )}
                            </Button>

                            {/* Go to Cart Link */}
                            <Link href="/cart" className="block mt-3">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full rounded-xl py-6 border-gray-200 text-gray-700 hover:bg-gray-50"
                                >
                                    Ver carrito
                                </Button>
                            </Link>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    <Truck className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Envio gratis</p>
                                    <p className="text-xs text-gray-500">+$50.000</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Pago seguro</p>
                                    <p className="text-xs text-gray-500">Mercado Pago</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    <RotateCcw className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Devoluciones</p>
                                    <p className="text-xs text-gray-500">30 dias</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relacionados.length > 0 && (
                    <div className="mt-20">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Productos relacionados
                            </h2>
                            <Link
                                href="/shop"
                                className="text-violet-600 hover:text-violet-700 font-medium text-sm flex items-center gap-1"
                            >
                                Ver todos
                                <ChevronLeft className="w-4 h-4 rotate-180" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {relacionados.map((prod) => (
                                <Link
                                    key={prod.id}
                                    href={`/shop/${prod.id}`}
                                    className="group"
                                >
                                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 mb-4 relative overflow-hidden rounded-2xl shadow-sm group-hover:shadow-xl transition-all duration-500">
                                        {prod.images && prod.images.length > 0 && prod.images[0].url ? (
                                            <img
                                                src={prod.images[0].url}
                                                alt={prod.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Sparkles className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors line-clamp-2 mb-1">
                                        {prod.name}
                                    </h3>
                                    <p className="text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                        ${Number(prod.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
