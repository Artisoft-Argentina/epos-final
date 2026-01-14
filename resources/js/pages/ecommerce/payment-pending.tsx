import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import { CartProvider } from '@/contexts/CartContext';

interface Props {
    payment_id?: string;
}

export default function PaymentPending({ payment_id }: Props) {
    return (
        <CartProvider>
            <ShopLayout title="Pago Pendiente" cartCount={0}>
                <Head title="Pago Pendiente" />
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-md mx-auto text-center">
                        <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-yellow-600 mb-4">Pago Pendiente</h1>
                        <p className="text-gray-600 mb-6">
                            Tu pago está siendo procesado. Te notificaremos cuando se complete.
                        </p>
                        {payment_id && (
                            <p className="text-sm text-gray-500 mb-6">
                                ID de pago: {payment_id}
                            </p>
                        )}
                        <div className="space-y-3">
                            <Link href="/shop">
                                <Button className="w-full">
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
