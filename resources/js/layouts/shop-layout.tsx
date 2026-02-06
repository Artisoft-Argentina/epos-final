import { Head, Link } from '@inertiajs/react';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

interface ShopLayoutProps {
    title: string;
    children: React.ReactNode;
    cartCount?: number;
}

export default function ShopLayout({ title, children, cartCount = 0 }: ShopLayoutProps) {
    const { cartCount: contextCartCount } = useCart();
    const displayCartCount = contextCartCount || cartCount;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <Head title={title} />
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Top Bar */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center py-2 text-sm font-medium">
                    Envio gratis en compras mayores a $50.000
                </div>

                {/* Header */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-lg z-50 border-b border-gray-100 shadow-sm">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16 md:h-20">
                            {/* Logo */}
                            <Link href="/shop" className="flex items-center gap-2 group">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200 group-hover:shadow-violet-300 transition-shadow">
                                    <span className="text-white font-bold text-lg">T</span>
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
                                    TIENDA
                                </span>
                            </Link>

                            {/* Navigation Desktop */}
                            <nav className="hidden md:flex items-center gap-8">
                                <Link
                                    href="/shop"
                                    className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors relative group"
                                >
                                    Productos
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-600 group-hover:w-full transition-all duration-300"></span>
                                </Link>
                            </nav>

                            {/* Actions */}
                            <div className="flex items-center gap-2 md:gap-4">
                                {/* Cart */}
                                <Link
                                    href="/cart"
                                    className="relative p-2 rounded-full hover:bg-gray-100 transition-colors group"
                                >
                                    <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-gray-700 group-hover:text-violet-600 transition-colors" />
                                    {displayCartCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                                            {displayCartCount}
                                        </span>
                                    )}
                                </Link>

                                {/* User */}
                                <Link href="/dashboard" className="hidden md:block">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full hover:bg-gray-100"
                                    >
                                        <User className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
                                    </Button>
                                </Link>

                                {/* Mobile Menu Button */}
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    {mobileMenuOpen ? (
                                        <X className="h-6 w-6 text-gray-700" />
                                    ) : (
                                        <Menu className="h-6 w-6 text-gray-700" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu */}
                        {mobileMenuOpen && (
                            <div className="md:hidden border-t border-gray-100 py-4 space-y-4 animate-in slide-in-from-top duration-200">
                                <Link
                                    href="/shop"
                                    className="block text-sm font-medium text-gray-600 hover:text-violet-600 py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Productos
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="block text-sm font-medium text-gray-600 hover:text-violet-600 py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Mi Cuenta
                                </Link>
                            </div>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="min-h-[60vh]">{children}</main>

                {/* Footer */}
                <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white mt-20">
                    {/* Newsletter Section */}
                    <div className="border-b border-gray-800">
                        <div className="container mx-auto px-4 py-12">
                            <div className="max-w-2xl mx-auto text-center">
                                <h3 className="text-2xl md:text-3xl font-bold mb-3">
                                    Suscribite a nuestro newsletter
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    Recibe ofertas exclusivas y novedades directo en tu email
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                    <input
                                        type="email"
                                        placeholder="tu@email.com"
                                        className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                                    />
                                    <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl px-6 py-3 font-medium shadow-lg shadow-violet-500/25">
                                        Suscribirse
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Content */}
                    <div className="container mx-auto px-4 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="md:col-span-2">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">T</span>
                                    </div>
                                    <span className="text-xl font-bold">TIENDA</span>
                                </div>
                                <p className="text-gray-400 max-w-sm">
                                    Tu tienda online de confianza. Calidad, variedad y los mejores precios para vos.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-4">Enlaces</h3>
                                <ul className="space-y-3 text-gray-400">
                                    <li>
                                        <Link href="/shop" className="hover:text-violet-400 transition-colors">
                                            Productos
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/cart" className="hover:text-violet-400 transition-colors">
                                            Carrito
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/dashboard" className="hover:text-violet-400 transition-colors">
                                            Mi Cuenta
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-4">Contacto</h3>
                                <ul className="space-y-3 text-gray-400">
                                    <li>info@tienda.com</li>
                                    <li>+54 11 1234-5678</li>
                                    <li>Lun - Vie: 9:00 - 18:00</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="border-t border-gray-800">
                        <div className="container mx-auto px-4 py-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                                <p>&copy; {new Date().getFullYear()} TIENDA. Todos los derechos reservados.</p>
                                <div className="flex items-center gap-4">
                                    <span>Pagos seguros con</span>
                                    <span className="font-semibold text-sky-400">Mercado Pago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
