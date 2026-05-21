import { Head, Link, useForm } from '@inertiajs/react';
import ShopLayout from '@/layouts/shop-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { CartProvider } from '@/contexts/CartContext';

interface Props {
    user: {
        name: string;
        email: string;
    };
    cliente: {
        business_name: string;
        fantasy_name?: string | null;
        phone: string;
        address: string;
    };
}

export default function ClientProfile({ user, cliente }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        phone: cliente?.phone || '',
        address: cliente?.address || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/client/profile');
    };

    return (
        <CartProvider initialCartCount={0}>
            <ShopLayout title="Mi Perfil">
            <Head title="Mi Perfil" />
            
            <div className="container mx-auto px-4 py-8">
                <Link href="/client/dashboard" className="inline-flex items-center text-sm mb-6 hover:underline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Dashboard
                </Link>

                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold text-black mb-8">Mi Perfil</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user.email}
                                disabled
                                className="mt-1 bg-gray-100"
                            />
                            <p className="text-sm text-gray-500 mt-1">El email no puede ser modificado</p>
                        </div>

                        <div>
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                type="text"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="mt-1"
                            />
                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                        </div>

                        <div>
                            <Label htmlFor="address">Dirección</Label>
                            <Input
                                id="address"
                                type="text"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className="mt-1"
                            />
                            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                        </div>

                        <div className="flex gap-4">
                            <Button 
                                type="submit" 
                                disabled={processing}
                                className="bg-black text-white hover:bg-gray-800"
                            >
                                {processing ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                            
                            <Link href="/client/dashboard">
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
            </ShopLayout>
        </CartProvider>
    );
}
