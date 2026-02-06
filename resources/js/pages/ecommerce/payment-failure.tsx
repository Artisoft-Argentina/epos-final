import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';
import { XCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { CartProvider } from '@/contexts/CartContext';

interface Props {
    error?: string;
}

export default function PaymentFailure({ error }: Props) {
    return (
        <CartProvider>
            <ShopLayout title="Pago Fallido" cartCount={0}>
                <Head title="Pago Fallido" />
                <div className="container mx-auto px-4 py-16 md:py-24">
                    <div className="max-w-lg mx-auto text-center">
                        {/* Error Icon */}
                        <div className="relative mb-8">
                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-xl shadow-red-200">
                                <XCircle className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Pago no procesado
                        </h1>

                        {/* Description */}
                        <p className="text-gray-600 text-lg mb-8">
                            {error || 'Hubo un problema al procesar tu pago. Por favor, verifica los datos de tu tarjeta e intenta nuevamente.'}
                        </p>

                        {/* Tips */}
                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
                            <h3 className="font-semibold text-gray-900 mb-3">Posibles soluciones:</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-600 font-bold">•</span>
                                    Verifica que los datos de tu tarjeta sean correctos
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-600 font-bold">•</span>
                                    Asegurate de tener fondos suficientes
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-600 font-bold">•</span>
                                    Intenta con otro metodo de pago
                                </li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Link href="/checkout" className="block">
                                <Button
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl py-6 shadow-lg shadow-violet-200"
                                >
                                    <RefreshCw className="w-5 h-5 mr-2" />
                                    Intentar nuevamente
                                </Button>
                            </Link>
                            <Link href="/shop" className="block">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full rounded-xl py-6 border-gray-200"
                                >
                                    <ShoppingBag className="w-5 h-5 mr-2" />
                                    Volver a la tienda
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </ShopLayout>
        </CartProvider>
    );
}
