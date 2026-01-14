import { Head, Link } from '@inertiajs/react';
import ShopLayout from '@/layouts/shop-layout';
import { Package, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartProvider } from '@/contexts/CartContext';

interface Compra {
    id: number;
    numfactura: number;
    fecha: string;
    total: number;
    pagada: string;
    articulos: Array<{
        articulo: string;
        cantidad: number;
        preciounitario: number;
    }>;
}

interface Props {
    compras: {
        data: Compra[];
        links: any[];
    };
    cliente: {
        razonsocial: string;
        email: string;
    };
}

export default function ClientDashboard({ compras, cliente }: Props) {
    return (
        <CartProvider initialCartCount={0}>
            <ShopLayout title="Mi Cuenta">
            <Head title="Mi Cuenta" />
            
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-black mb-2">Mi Cuenta</h1>
                    <p className="text-gray-600">Bienvenido, {cliente.razonsocial}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Link href="/client/profile">
                        <div className="border border-gray-200 p-6 hover:border-black transition cursor-pointer">
                            <User className="h-8 w-8 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Mi Perfil</h3>
                            <p className="text-sm text-gray-600">Actualiza tu información personal</p>
                        </div>
                    </Link>

                    <div className="border border-gray-200 p-6">
                        <Package className="h-8 w-8 mb-4" />
                        <h3 className="font-bold text-lg mb-2">Mis Compras</h3>
                        <p className="text-sm text-gray-600">{compras.data.length} compras realizadas</p>
                    </div>

                    <Link href="/logout" method="post" as="button" className="w-full text-left">
                        <div className="border border-gray-200 p-6 hover:border-red-500 transition cursor-pointer">
                            <LogOut className="h-8 w-8 mb-4 text-red-500" />
                            <h3 className="font-bold text-lg mb-2">Cerrar Sesión</h3>
                            <p className="text-sm text-gray-600">Salir de tu cuenta</p>
                        </div>
                    </Link>
                </div>

                <div className="border border-gray-200 p-6">
                    <h2 className="text-2xl font-bold mb-6">Mis Compras</h2>
                    
                    {compras.data.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No tienes compras realizadas</p>
                            <Link href="/shop">
                                <Button className="mt-4 bg-black text-white hover:bg-gray-800">
                                    Ir a la tienda
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {compras.data.map((compra) => (
                                <div key={compra.id} className="border border-gray-200 p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-bold">Factura #{compra.numfactura}</p>
                                            <p className="text-sm text-gray-600">{compra.fecha}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">${Number(compra.total).toFixed(2)}</p>
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                compra.pagada === 'SI' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {compra.pagada === 'SI' ? 'Pagado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {compra.articulos.map((articulo, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span>{articulo.cantidad}x {articulo.articulo}</span>
                                                <span>${Number(articulo.preciounitario).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {compras.links && compras.links.length > 3 && (
                        <div className="flex justify-center mt-6 gap-2">
                            {compras.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-3 py-2 text-sm ${
                                        link.active 
                                            ? 'bg-black text-white' 
                                            : 'border border-gray-300 hover:bg-gray-100 bg-white text-black'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ShopLayout>
        </CartProvider>
    );
}
