import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, Package, Tag, ShoppingCart, FileText, Settings, Truck, MessageSquare, Brain, ShoppingBag, PackageCheck, Camera, Warehouse, Store, ArrowLeftRight } from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Clientes',
        icon: Users,
        items: [
            {
                title: 'Clientes',
                href: '/customers',
            },
        ],
    },
    {
        title: 'Artículos',
        icon: ShoppingCart,
        items: [
            {
                title: 'Artículos',
                href: '/articulos',
            },
            {
                title: 'Categorías',
                href: '/categories',
            },
            {
                title: 'Marcas',
                href: '/brands',
            },
        ],
    },
    {
        title: 'Inventario',
        icon: Package,
        items: [
            {
                title: 'Stock por almacén',
                href: '/inventarios',
            },
            {
                title: 'Transferencias',
                href: '/transferencias',
                icon: ArrowLeftRight,
            },
        ],
    },
    {
        title: 'Ventas',
        icon: ShoppingCart,
        items: [
            {
                title: 'Ventas',
                href: '/ventas',
            },
            {
                title: 'Presupuestos',
                href: '/presupuestos',
            },
            {
                title: 'Entregas Pendientes',
                href: '/entregas',
                icon: PackageCheck,
            },
        ],
    },
    {
        title: 'Listas de Precios',
        href: '/listas-precios',
        icon: Tag,
    },
    {
        title: 'Proveedores',
        icon: Truck,
        items: [
            {
                title: 'Proveedores',
                href: '/suppliers',
            },
            {
                title: 'Órdenes de Compra',
                href: '/orders',
            },
        ],
    },
    {
        title: 'IA',
        icon: Brain,
        items: [
            {
                title: 'Asistente IA',
                href: '/chat',
            },
            {
                title: 'Asistente Compras',
                href: '/asistente-compras',
            },
        ],
    },
    {
        title: 'Configuración',
        icon: Settings,
        items: [
            {
                title: 'Usuarios',
                href: '/users',
            },
            {
                title: 'Roles',
                href: '/roles',
            },
            {
                title: 'Empresa',
                href: '/empresa',
            },
            {
                title: 'Almacenes',
                href: '/almacenes',
                icon: Warehouse,
            },
            {
                title: 'Puntos de Venta',
                href: '/puntos-venta',
                icon: Store,
            },
            {
                title: 'Registro de Actividad',
                href: '/activity-log',
            },
            {
                title: 'AFIP',
                href: '/settings/afip',
            },
        ],
    },

];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage<any>().props;
    const userRole = auth?.user?.role?.role;

    const getFilteredNavItems = () => {
        if (userRole === 'superadmin') {
            return mainNavItems;
        }
        
        if (userRole === 'admin') {
            // Admin ve todo excepto Configuración
            return mainNavItems.filter(item => item.title !== 'Configuración');
        }
        
        if (userRole === 'vendedor') {
            return mainNavItems.filter(item => {
                return ['Ventas', 'Clientes', 'Inventario', 'Artículos'].includes(item.title);
            });
        }
        
        // Para roles no definidos, mostrar todo por defecto
        return mainNavItems;
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                                <AppLogoIcon className="hidden size-8 object-contain group-data-[collapsible=icon]:block" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={getFilteredNavItems()} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
