import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';
import { CartProvider } from '@/contexts/CartContext';

interface Props {
    payment_id?: string;
}

export default function PaymentSuccess({ payment_id }: Props) {
    return (
        <CartProvider>
            <ShopLayout title="Pago Exitoso" cartCount={0}>
                <Head title="Pago Exitoso" />
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-md mx-auto text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-green-600 mb-4">¡Pago Exitoso!</h1>
                        <p className="text-gray-600 mb-6">
                            Tu pago ha sido procesado correctamente. Recibirás un email de confirmación en breve.
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
