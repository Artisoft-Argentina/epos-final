import ShopLayout from '@/layouts/shop-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CartProvider } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { ChevronLeft, Shield, Lock, CreditCard, Sparkles } from 'lucide-react';

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
    total: number;
    publicKey: string;
}

function CheckoutContent({ cartItems, total, publicKey }: Props) {
    const [mpReady, setMpReady] = useState(false);

    useEffect(() => {
        console.log('Public Key:', publicKey);
        if (!publicKey) {
            console.error('MercadoPago Public Key no configurado');
            return;
        }
        
        try {
            console.log('Inicializando MercadoPago...');
            initMercadoPago(publicKey, {
                locale: 'es-AR'
            });
            console.log('MercadoPago inicializado correctamente');
            setMpReady(true);
        } catch (error) {
            console.error('Error al inicializar MercadoPago:', error);
            alert('Error al cargar el formulario de pago. Por favor, desactiva tu bloqueador de anuncios y recarga la página.');
        }
    }, [publicKey]);

    const onSubmit = async (formData: any): Promise<void> => {
        router.post('/checkout/payment', {
            token: formData.token,
            payment_method_id: formData.payment_method_id,
            installments: formData.installments,
            issuer_id: formData.issuer_id,
        }, {
            onError: (errors) => {
                console.error('Payment error:', errors);
            }
        });
    };

    const onError = (error: any) => {
        console.error('Payment error:', error);
        alert('Error en el formulario de pago');
    };

    const onReady = () => {
        console.log('Payment form ready');
    };

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <ShopLayout title="Checkout" cartCount={cartCount}>
            <Head title="Checkout" />

            <div className="container mx-auto px-4 py-8 md:py-12">
                {/* Breadcrumb */}
                <div className="mb-8">
                    <Link
                        href="/cart"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Volver al carrito</span>
                    </Link>
                </div>

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Finalizar Compra</h1>
                    <p className="text-gray-500">Completa tu pago de forma segura</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Order Summary */}
                    <div className="order-2 lg:order-1">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-violet-600" />
                                Resumen del Pedido
                            </h2>

                            <div className="space-y-4 mb-6">
                                {cartItems.map((cartItem) => (
                                    <div key={cartItem.id} className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                                            {cartItem.articulo.imagenes && cartItem.articulo.imagenes.length > 0 ? (
                                                <img
                                                    src={`/storage/${cartItem.articulo.imagenes[0].ruta}`}
                                                    alt={cartItem.articulo.articulo}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Sparkles className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 line-clamp-1">{cartItem.articulo.articulo}</h3>
                                            <p className="text-sm text-gray-500">Cantidad: {cartItem.quantity}</p>
                                        </div>

                                        <span className="font-semibold text-gray-900">
                                            ${(cartItem.articulo.precio * cartItem.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Envio</span>
                                    <span className="text-green-600 font-medium">Gratis</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-900">Total a pagar</span>
                                        <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                            ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                                    <Shield className="w-5 h-5 text-green-600" />
                                    <span>Compra protegida con Mercado Pago</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Lock className="w-5 h-5 text-green-600" />
                                    <span>Tus datos estan encriptados y seguros</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div className="order-1 lg:order-2">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-violet-600" />
                                Pago Seguro
                            </h2>

                            {mpReady ? (
                                <div className="mercadopago-form">
                                    <CardPayment
                                        initialization={{
                                            amount: total,
                                        }}
                                        onSubmit={onSubmit}
                                        onReady={onReady}
                                        onError={onError}
                                    />
                                </div>
                            ) : publicKey ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 mx-auto mb-4 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                                    <p className="text-gray-600">Cargando formulario de pago...</p>
                                    <p className="text-xs text-gray-400 mt-2">Si no carga, desactiva tu bloqueador de anuncios</p>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-red-600 mb-4">
                                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-900 font-semibold mb-2">Error de configuración</p>
                                    <p className="text-gray-600 text-sm">No se pudo cargar el sistema de pagos. Contacta al administrador.</p>
                                </div>
                            )}

                            {/* Mercado Pago Badge */}
                            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                                <p className="text-sm text-gray-500 mb-2">Procesado de forma segura por</p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-xl">
                                    <span className="font-bold text-sky-600">Mercado Pago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}

export default function Checkout(props: Props) {
    return (
        <CartProvider initialCartCount={props.cartItems.length}>
            <CheckoutContent {...props} />
        </CartProvider>
    );
}
