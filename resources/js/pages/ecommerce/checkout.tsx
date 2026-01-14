import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, router } from '@inertiajs/react';
import { CartProvider } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';

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
    const [isLoading, setIsLoading] = useState(false);
    const [mpReady, setMpReady] = useState(false);

    useEffect(() => {
        if (publicKey) {
            try {
                initMercadoPago(publicKey, {
                    locale: 'es-AR'
                });
                setMpReady(true);
            } catch (error) {
                console.error('MercadoPago initialization error:', error);
            }
        }
    }, [publicKey]);

    const onSubmit = (formData: any) => {
        setIsLoading(true);
        
        router.post('/checkout/payment', {
            token: formData.token,
            payment_method_id: formData.payment_method_id,
            installments: formData.installments,
            issuer_id: formData.issuer_id,
        }, {
            onError: (errors) => {
                console.error('Payment error:', errors);
                setIsLoading(false);
            },
            onFinish: () => {
                setIsLoading(false);
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

    return (
        <ShopLayout title="Checkout" cartCount={cartItems.length}>
            <Head title="Checkout" />
            <div className="container mx-auto px-4 py-8 bg-white text-black">
                <h1 className="text-3xl font-bold mb-8 text-black">CHECKOUT</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-black">Resumen del Pedido</h2>
                        <div className="space-y-4">
                            {cartItems.map((cartItem) => (
                                <div key={cartItem.id} className="flex items-center gap-4 border-b border-gray-300 pb-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
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
                                    
                                    <div className="flex-1">
                                        <h3 className="font-medium text-black">{cartItem.articulo.articulo}</h3>
                                        <p className="text-gray-600 text-sm">Cantidad: {cartItem.quantity}</p>
                                    </div>
                                    
                                    <span className="font-bold text-black">
                                        ${(cartItem.articulo.precio * cartItem.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            <div className="border-t border-gray-300 pt-4">
                                <div className="flex justify-between text-xl font-bold text-black">
                                    <span>Total:</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold mb-4 text-black">Pago</h2>
                        <div className="border border-gray-300 p-6 rounded-lg bg-white">
                            {mpReady ? (
                                <CardPayment
                                    initialization={{
                                        amount: total,
                                    }}
                                    onSubmit={onSubmit}
                                    onReady={onReady}
                                    onError={onError}
                                />
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-600">Cargando formulario de pago...</p>
                                </div>
                            )}
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
