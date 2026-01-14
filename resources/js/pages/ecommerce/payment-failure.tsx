import { Button } from '@/components/ui/button';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';
import { XCircle } from 'lucide-react';
import { CartProvider } from '@/contexts/CartContext';

interface Props {
    error?: string;
}

export default function PaymentFailure({ error }: Props) {
    return (
        <CartProvider>
            <ShopLayout title="Pago Fallido" cartCount={0}>
                <Head title="Pago Fallido" />
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-md mx-auto text-center">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-red-600 mb-4">Pago Fallido</h1>
                        <p className="text-gray-600 mb-6">
                            {error || 'Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.'}
                        </p>
                        <div className="space-y-3">
                            <Link href="/checkout">
                                <Button className="w-full">
                                    Intentar nuevamente
                                </Button>
                            </Link>
                            <Link href="/shop">
                                <Button variant="outline" className="w-full">
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
