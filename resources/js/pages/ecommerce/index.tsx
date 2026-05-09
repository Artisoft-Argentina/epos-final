import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Link, router } from '@inertiajs/react';
import { CartProvider } from '@/contexts/CartContext';
import { ShoppingCart, Sparkles, ArrowRight, Star } from 'lucide-react';
import { useState } from 'react';

interface Articulo {
    id: number;
    name: string;
    price: number;
    category?: { id: number; name: string } | null;
    brand?: { id: number; name: string } | null;
    images?: Array<{
        id: number;
        path: string;
        url?: string;
    }>;
}

interface Props {
    articulos: {
        data: Articulo[];
        links: any[];
        current_page: number;
        last_page: number;
    };
    cartCount: number;
}

function ProductCard({ articulo, onAddToCart }: { articulo: Articulo; onAddToCart: (id: number) => void }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsAdding(true);
        onAddToCart(articulo.id);
    };

    return (
        <div
            className="group relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/shop/${articulo.id}`} className="block">
                {/* Image Container */}
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl mb-4 relative overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500">
                    {articulo.images && articulo.images.length > 0 ? (
                        <img
                            src={articulo.images[0].url || `/storage/${articulo.images[0].path}`}
                            alt={articulo.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-gray-400" />
                                </div>
                                <span className="text-gray-400 text-sm">Sin imagen</span>
                            </div>
                        </div>
                    )}

                    {/* Overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

                    {/* Quick add button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isAdding}
                        className={`absolute bottom-4 left-4 right-4 bg-white text-gray-900 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transform transition-all duration-300 hover:bg-violet-600 hover:text-white shadow-lg ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {isAdding ? 'Agregando...' : 'Agregar al carrito'}
                    </button>

                    {/* Category badge */}
                    {articulo.category && (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                            {articulo.category.name}
                        </span>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-2 px-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors line-clamp-2">
                        {articulo.name}
                    </h3>
                    {articulo.brand && (
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                            {articulo.brand.name}
                        </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            ${Number(articulo.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </Link>
        </div>
    );
}

function EcommerceIndexContent({ articulos, cartCount }: Props) {
    const addToCart = (articuloId: number) => {
        router.post(`/cart/${articuloId}`, {
            quantity: 1
        }, {
            preserveScroll: true,
            onSuccess: () => {
                window.location.reload();
            },
            onError: (errors) => {
                console.error('Error al agregar al carrito:', errors);
            }
        });
    };

    return (
        <ShopLayout title="Tienda Online" cartCount={cartCount}>
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700" />

                {/* Decorative elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            <span className="text-white/90 text-sm font-medium">Nueva Coleccion 2026</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                            Descubri lo
                            <span className="block bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                                mejor para vos
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
                            Explora nuestra coleccion de productos seleccionados con la mejor calidad y precios increibles
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                className="bg-white text-violet-600 hover:bg-gray-100 rounded-full px-8 py-6 text-lg font-semibold shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                                onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Ver Productos
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>

                        {/* Trust badges */}
                        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-white/70 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                                </div>
                                <span>+1000 clientes felices</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <ShoppingCart className="w-4 h-4 text-white" />
                                </div>
                                <span>Envio gratis +$50k</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249 250 251)" />
                    </svg>
                </div>
            </section>

            {/* Products Section */}
            <section id="productos" className="container mx-auto px-4 py-12 md:py-16">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            Nuestros Productos
                        </h2>
                        <p className="text-gray-500">
                            {articulos.data.length} productos disponibles
                        </p>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                    {articulos.data.map((articulo) => (
                        <ProductCard
                            key={articulo.id}
                            articulo={articulo}
                            onAddToCart={addToCart}
                        />
                    ))}
                </div>

                {/* Empty State */}
                {articulos.data.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <ShoppingCart className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay productos disponibles</h3>
                        <p className="text-gray-500">Vuelve pronto para ver nuestras novedades</p>
                    </div>
                )}

                {/* Pagination */}
                {articulos.last_page > 1 && (
                    <div className="flex justify-center mt-12">
                        <div className="flex items-center gap-2">
                            {articulos.links.map((link, index) => (
                                link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                            link.active
                                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200'
                                                : 'bg-white text-gray-700 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span
                                        key={index}
                                        className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Features Section */}
            <section className="bg-gradient-to-b from-gray-50 to-white py-16">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Envio Rapido</h3>
                            <p className="text-gray-500">Recibe tu pedido en tiempo record</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pago Seguro</h3>
                            <p className="text-gray-500">Tus datos protegidos con Mercado Pago</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Soporte 24/7</h3>
                            <p className="text-gray-500">Estamos aqui para ayudarte</p>
                        </div>
                    </div>
                </div>
            </section>
        </ShopLayout>
    );
}

export default function EcommerceIndex(props: Props) {
    return (
        <CartProvider initialCartCount={props.cartCount}>
            <EcommerceIndexContent {...props} />
        </CartProvider>
    );
}
