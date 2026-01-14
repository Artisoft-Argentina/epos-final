import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CartProvider } from '@/contexts/CartContext';

interface Articulo {
    id: number;
    articulo: string;
    precio: number;
    categoria?: { nombre: string };
    marca?: { nombre: string };
    imagenes?: Array<{
        id: number;
        ruta: string;
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
            <div className="bg-gradient-to-r from-gray-900 to-black text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl font-bold mb-4">NUEVA COLECCIÓN</h1>
                    <p className="text-xl mb-8">Descubre los últimos productos</p>
                    <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                        COMPRAR AHORA
                    </Button>
                </div>
            </div>
            
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-wrap items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-black">PRODUCTOS ({articulos.data.length})</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {articulos.data.map((articulo) => (
                        <div key={articulo.id} className="group cursor-pointer">
                            <div className="aspect-square bg-gray-100 mb-4 relative overflow-hidden">
                                {articulo.imagenes && articulo.imagenes.length > 0 ? (
                                    <img 
                                        src={articulo.imagenes[0].url || `/storage/${articulo.imagenes[0].ruta}`}
                                        alt={articulo.articulo}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-400 text-sm">Sin imagen</span>
                                    </div>
                                )}
                                <button 
                                    onClick={() => addToCart(articulo.id)}
                                    className="absolute bottom-2 right-2 bg-black text-white px-3 py-1 text-xs rounded hover:bg-gray-800"
                                >
                                    +
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="font-medium text-sm uppercase tracking-wide text-black">{articulo.articulo}</h3>
                                <p className="text-xs text-gray-500 uppercase">
                                    {articulo.categoria?.nombre}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-lg">
                                        ${Number(articulo.precio).toFixed(2)}
                                    </span>
                                    {articulo.marca && (
                                        <span className="text-xs text-gray-500 uppercase">
                                            {articulo.marca.nombre}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-center mt-12">
                    <div className="flex items-center gap-2">
                        {articulos.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`px-3 py-2 text-sm ${
                                    link.active 
                                        ? 'bg-black text-white' 
                                        : 'border border-gray-300 hover:bg-gray-100 bg-white text-black'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>
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
