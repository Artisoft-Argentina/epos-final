import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { CartProvider } from '@/contexts/CartContext';

interface CartItem {
    id: number;
    quantity: number;
    articulo: {
        id: number;
        articulo: string;
        precio: number;
        imagenes?: Array<{
            id: number;
            ruta: string;
        }>;
    };
}

interface Props {
    cartItems: CartItem[];
}

export default function EcommerceCart({ cartItems }: Props) {
    const total = cartItems.reduce((sum, cartItem) => 
        sum + (Number(cartItem.articulo.precio) * cartItem.quantity), 0
    );

    const cartCount = cartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
    
    const clearCart = () => {
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            router.delete('/cart');
        }
    };
    
    const updateQuantity = (cartItemId: number, newQuantity: number) => {
        if (newQuantity < 1) newQuantity = 1;
        router.patch(`/cart/${cartItemId}`, {
            quantity: newQuantity
        }, {
            preserveScroll: true,
        });
    };
    
    const removeCartItem = (cartItemId: number) => {
        if (confirm('¿Eliminar este producto del carrito?')) {
            router.delete(`/cart/${cartItemId}`);
        }
    };

    return (
        <CartProvider initialCartItems={cartItems} initialCartCount={cartCount}>
            <ShopLayout title="Carrito de Compras" cartCount={cartCount}>
            <Head title="Carrito de Compras" />
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-6 w-6" />
                        <h1 className="text-2xl font-bold text-black">CARRITO DE COMPRAS</h1>
                    </div>
                    {cartItems.length > 0 && (
                        <Button 
                            variant="outline" 
                            onClick={clearCart}
                            className="text-red-600 border-red-600 hover:bg-red-50 bg-white"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Vaciar Carrito
                        </Button>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    <div className="text-center py-16">
                        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-black">Tu carrito está vacío</h2>
                        <p className="text-gray-600 mb-8">Agrega productos para comenzar a comprar</p>
                        <Link href="/shop">
                            <Button size="lg" className="bg-black text-white hover:bg-gray-800">
                                CONTINUAR COMPRANDO
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <div className="space-y-4">
                                {cartItems.map((cartItem) => (
                                    <div key={cartItem.id} className="border border-gray-200 p-4 md:p-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                {cartItem.articulo.imagenes && cartItem.articulo.imagenes.length > 0 ? (
                                                    <img 
                                                        src={`/storage/${cartItem.articulo.imagenes[0].ruta}`}
                                                        alt={cartItem.articulo.articulo}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">Sin imagen</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-base md:text-lg uppercase truncate text-black">{cartItem.articulo.articulo}</h3>
                                                <p className="text-gray-600 text-sm mt-1">
                                                    ${Number(cartItem.articulo.precio).toFixed(2)} c/u
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4">
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                                                        disabled={cartItem.quantity <= 1}
                                                        className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                                                    >
                                                        <Minus className="h-4 w-4 text-black" />
                                                    </button>
                                                    <span className="w-8 text-center font-medium text-black">{cartItem.quantity}</span>
                                                    <button 
                                                        onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                                                        className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-100 bg-white"
                                                    >
                                                        <Plus className="h-4 w-4 text-black" />
                                                    </button>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <p className="font-bold text-lg text-black">
                                                        ${(Number(cartItem.articulo.precio) * cartItem.quantity).toFixed(2)}
                                                    </p>
                                                    <button 
                                                        onClick={() => removeCartItem(cartItem.id)}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="border border-gray-200 p-6 sticky top-8">
                                <h2 className="text-xl font-bold mb-6 text-black">RESUMEN DEL PEDIDO</h2>
                                
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-black">Subtotal ({cartCount} productos):</span>
                                        <span className="text-black">${total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-black">Envío:</span>
                                        <span className="text-green-600">Gratis</span>
                                    </div>
                                    <div className="border-t pt-4">
                                        <div className="flex justify-between text-xl font-bold">
                                            <span className="text-black">Total:</span>
                                            <span className="text-black">${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <Link href="/checkout">
                                        <Button className="w-full bg-black text-white hover:bg-gray-800" size="lg">
                                            PROCEDER AL PAGO
                                        </Button>
                                    </Link>
                                    <Link href="/shop">
                                        <Button variant="outline" className="w-full bg-white text-black border-gray-300" size="lg">
                                            CONTINUAR COMPRANDO
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            </ShopLayout>
        </CartProvider>
    );
}
