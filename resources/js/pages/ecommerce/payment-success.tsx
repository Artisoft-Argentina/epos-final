import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { CartProvider } from '@/contexts/CartContext';

interface Props {
    payment_id?: string;
}

export default function PaymentSuccess({ payment_id }: Props) {
    return (
        <CartProvider>
            <ShopLayout title="Pago Exitoso" cartCount={0}>
                <Head title="Pago Exitoso" />
                <div className="container mx-auto px-4 py-16 md:py-24">
                    <div className="max-w-lg mx-auto text-center">
                        {/* Success Icon */}
                        <div className="relative mb-8">
                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-200">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>
                            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-green-400 animate-ping opacity-20" />
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            ¡Pago Exitoso!
                        </h1>

                        {/* Description */}
                        <p className="text-gray-600 text-lg mb-6">
                            Tu pago ha sido procesado correctamente. Recibiras un email de confirmacion con los detalles de tu compra.
                        </p>

                        {/* Payment ID */}
                        {payment_id && (
                            <div className="inline-flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2 mb-8">
                                <span className="text-sm text-gray-500">ID de pago:</span>
                                <span className="text-sm font-mono font-medium text-gray-900">{payment_id}</span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3">
                            <Link href="/shop" className="block">
                                <Button
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl py-6 shadow-lg shadow-violet-200"
                                >
                                    <ShoppingBag className="w-5 h-5 mr-2" />
                                    Seguir comprando
                                </Button>
                            </Link>
                            <Link href="/dashboard" className="block">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full rounded-xl py-6 border-gray-200"
                                >
                                    Ver mis pedidos
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </div>

                        {/* Thank you message */}
                        <p className="mt-10 text-sm text-gray-500">
                            ¡Gracias por tu compra!
                        </p>
                    </div>
                </div>
            </ShopLayout>
        </CartProvider>
    );
}
