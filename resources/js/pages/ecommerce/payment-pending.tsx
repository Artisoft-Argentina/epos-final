import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';
import { Clock, ShoppingBag, Mail } from 'lucide-react';
import { CartProvider } from '@/contexts/CartContext';

interface Props {
    payment_id?: string;
}

export default function PaymentPending({ payment_id }: Props) {
    return (
        <CartProvider>
            <ShopLayout title="Pago Pendiente" cartCount={0}>
                <Head title="Pago Pendiente" />
                <div className="container mx-auto px-4 py-16 md:py-24">
                    <div className="max-w-lg mx-auto text-center">
                        {/* Pending Icon */}
                        <div className="relative mb-8">
                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-200">
                                <Clock className="w-12 h-12 text-white" />
                            </div>
                            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-amber-400 border-t-transparent animate-spin opacity-30" />
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Pago en proceso
                        </h1>

                        {/* Description */}
                        <p className="text-gray-600 text-lg mb-6">
                            Tu pago esta siendo procesado. Te notificaremos por email cuando se complete la transaccion.
                        </p>

                        {/* Payment ID */}
                        {payment_id && (
                            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-8">
                                <span className="text-sm text-amber-700">ID de pago:</span>
                                <span className="text-sm font-mono font-medium text-amber-900">{payment_id}</span>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                            <div className="flex items-center justify-center gap-3 text-gray-600">
                                <Mail className="w-5 h-5 text-violet-600" />
                                <span>Revisa tu email para ver el estado de tu pago</span>
                            </div>
                        </div>

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
                        </div>

                        {/* Note */}
                        <p className="mt-10 text-sm text-gray-500">
                            El procesamiento puede demorar hasta 48 horas habiles
                        </p>
                    </div>
                </div>
            </ShopLayout>
        </CartProvider>
    );
}
