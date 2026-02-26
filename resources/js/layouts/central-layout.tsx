import { Link, router, usePage } from '@inertiajs/react';
import { Building2, LogOut, LayoutDashboard } from 'lucide-react';
import { type ReactNode } from 'react';
import { Toaster } from 'sonner';

interface Props {
    children: ReactNode;
    title?: string;
}

export default function CentralLayout({ children, title }: Props) {
    const { auth } = usePage<any>().props;

    const handleLogout = () => {
        router.post(route('central.logout'));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Navbar central */}
            <nav className="border-b bg-white dark:bg-gray-900 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Link href={route('central.dashboard')} className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                                <Building2 className="h-6 w-6 text-blue-600" />
                                <span>EPOS — Panel Central</span>
                            </Link>
                            <Link
                                href={route('central.dashboard')}
                                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <Link
                                href={route('central.tenants.index')}
                                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                Empresas
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {auth?.user?.name ?? 'Superadmin'}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                                <LogOut className="h-4 w-4" />
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Contenido */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {title && (
                    <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
                )}
                {children}
            </main>

            <Toaster position="top-right" />
        </div>
    );
}
