import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ShoppingBag, Minus, Plus, Trash2, ShoppingCart, ArrowRight, Sparkles, Shield, Truck } from 'lucide-react';
import { CartProvider } from '@/contexts/CartContext';

interface CartItem {
    id: number;
    quantity: number;
    articulo: {
        id: number;
        name: string;
        price: number;
        images?: Array<{
            id: number;
            path: string;
            url?: string;
        }>;
    };
}

interface Props {
    cartItems: CartItem[];
}

export default function EcommerceCart({ cartItems }: Props) {
    const total = cartItems.reduce((sum, cartItem) =>
        sum + (Number(cartItem.articulo.price) * cartItem.quantity), 0
    );

    const cartCount = cartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

    const clearCart = () => {
        if (confirm('¿Estas seguro de que quieres vaciar el carrito?')) {
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

            <div className="container mx-auto px-4 py-8 md:py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Carrito de Compras</h1>
                            <p className="text-gray-500 text-sm">{cartCount} {cartCount === 1 ? 'producto' : 'productos'}</p>
                        </div>
                    </div>
                    {cartItems.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={clearCart}
                            className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Vaciar Carrito
                        </Button>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    /* Empty Cart State */
                    <div className="text-center py-16 md:py-24">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                            <ShoppingCart className="h-12 w-12 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Tu carrito esta vacio</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Parece que aun no has agregado productos. Explora nuestra tienda y encuentra lo que buscas.
                        </p>
                        <Link href="/shop">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl px-8 shadow-lg shadow-violet-200"
                            >
                                Explorar Productos
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((cartItem) => (
                                <div
                                    key={cartItem.id}
                                    className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        {/* Image */}
                                        <Link href={`/shop/${cartItem.articulo.id}`} className="flex-shrink-0">
                                            <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl overflow-hidden">
                                                {cartItem.articulo.images && cartItem.articulo.images.length > 0 ? (
                                                    <img
                                                        src={`/storage/${cartItem.articulo.images[0].path}`}
                                                        alt={cartItem.articulo.name}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Sparkles className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/shop/${cartItem.articulo.id}`}>
                                                <h3 className="font-semibold text-gray-900 hover:text-violet-600 transition-colors line-clamp-2 mb-1">
                                                    {cartItem.articulo.name}
                                                </h3>
                                            </Link>
                                            <p className="text-gray-500 text-sm mb-3">
                                                ${Number(cartItem.articulo.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })} c/u
                                            </p>

                                            {/* Mobile: Price and Actions */}
                                            <div className="flex items-center justify-between sm:hidden">
                                                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                                    <button
                                                        onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                                                        disabled={cartItem.quantity <= 1}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50"
                                                    >
                                                        <Minus className="h-4 w-4 text-gray-600" />
                                                    </button>
                                                    <span className="w-8 text-center font-semibold text-gray-900">{cartItem.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                                                    >
                                                        <Plus className="h-4 w-4 text-gray-600" />
                                                    </button>
                                                </div>
                                                <p className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                                    ${(Number(cartItem.articulo.price) * cartItem.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Desktop: Quantity and Price */}
                                        <div className="hidden sm:flex items-center gap-6">
                                            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                                                <button
                                                    onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                                                    disabled={cartItem.quantity <= 1}
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50"
                                                >
                                                    <Minus className="h-4 w-4 text-gray-600" />
                                                </button>
                                                <span className="w-10 text-center font-semibold text-gray-900">{cartItem.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                                                >
                                                    <Plus className="h-4 w-4 text-gray-600" />
                                                </button>
                                            </div>

                                            <div className="text-right min-w-[100px]">
                                                <p className="font-bold text-xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                                    ${(Number(cartItem.articulo.price) * cartItem.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => removeCartItem(cartItem.id)}
                                                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>

                                        {/* Mobile: Delete Button */}
                                        <button
                                            onClick={() => removeCartItem(cartItem.id)}
                                            className="sm:hidden p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all self-end"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen del pedido</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal ({cartCount} {cartCount === 1 ? 'producto' : 'productos'})</span>
                                        <span className="font-medium text-gray-900">
                                            ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Envio</span>
                                        <span className="font-medium text-green-600">Gratis</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="flex justify-between">
                                            <span className="text-lg font-bold text-gray-900">Total</span>
                                            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                                ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Link href="/checkout" className="block">
                                        <Button
                                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl py-6 text-lg font-semibold shadow-lg shadow-violet-200"
                                            size="lg"
                                        >
                                            Proceder al pago
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                    <Link href="/shop" className="block">
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
                                            size="lg"
                                        >
                                            Continuar comprando
                                        </Button>
                                    </Link>
                                </div>

                                {/* Trust Badges */}
                                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Shield className="w-5 h-5 text-violet-600" />
                                        <span>Pago seguro con Mercado Pago</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Truck className="w-5 h-5 text-violet-600" />
                                        <span>Envio gratis en compras +$50.000</span>
                                    </div>
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
