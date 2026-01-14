import { Head, Link } from '@inertiajs/react';
import { ShoppingCart, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

interface ShopLayoutProps {
    title: string;
    children: React.ReactNode;
    cartCount?: number;
}

export default function ShopLayout({ title, children, cartCount = 0 }: ShopLayoutProps) {
    const { cartCount: contextCartCount } = useCart();
    const displayCartCount = contextCartCount || cartCount;

    return (
        <>
            <Head title={title} />
            <div className="min-h-screen bg-white">
                {/* Header */}
                <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16">
                            <Link href="/shop" className="text-2xl font-bold text-black">
                                TIENDA
                            </Link>
                            
                            <nav className="hidden md:flex items-center gap-8">
                                <Link href="/shop" className="text-sm font-medium hover:text-gray-600">
                                    PRODUCTOS
                                </Link>
                            </nav>
                            
                            <div className="flex items-center gap-4">
                                <Link href="/cart" className="relative">
                                    <ShoppingCart className="h-6 w-6 text-black" />
                                    {displayCartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                            {displayCartCount}
                                        </span>
                                    )}
                                </Link>
                                
                                <Link href="/dashboard">
                                    <Button variant="ghost" size="icon">
                                        <User className="h-6 w-6" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main>{children}</main>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-12 mt-20">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <h3 className="font-bold text-lg mb-4">TIENDA</h3>
                                <p className="text-gray-400">Tu tienda online de confianza</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-4">ENLACES</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li><Link href="/shop">Productos</Link></li>
                                    <li><Link href="/cart">Carrito</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-4">CONTACTO</h3>
                                <p className="text-gray-400">Email: info@tienda.com</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
