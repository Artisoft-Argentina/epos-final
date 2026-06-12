import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, Package, Tag, ShoppingCart, FileText, Settings, Truck, MessageSquare, Brain, ShoppingBag, PackageCheck, Camera, Warehouse, Store, ArrowLeftRight } from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';
import { usePermission } from '@/hooks/use-permission';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Clientes',
        icon: Users,
        permission: 'customers.index',
        items: [
            {
                title: 'Clientes',
                href: '/customers',
                permission: 'customers.index',
            },
        ],
    },
    {
        title: 'Productos',
        icon: Package,
        permission: 'products.index',
        items: [
            {
                title: 'Productos',
                href: '/products',
                permission: 'products.index',
            },
            {
                title: 'Categorías',
                href: '/categories',
                permission: 'categories.index',
            },
            {
                title: 'Marcas',
                href: '/brands',
                permission: 'brands.index',
            },
        ],
    },
    {
        title: 'Inventario',
        icon: Package,
        permission: 'inventarios.index',
        items: [
            {
                title: 'Stock por almacén',
                href: '/inventarios',
                permission: 'inventarios.index',
            },
            {
                title: 'Transferencias',
                href: '/transferencias',
                icon: ArrowLeftRight,
                permission: 'transferencias.index',
            },
        ],
    },
    {
        title: 'Ventas',
        icon: ShoppingCart,
        permission: 'ventas.index',
        items: [
            {
                title: 'Ventas',
                href: '/ventas',
                permission: 'ventas.index',
            },
            {
                title: 'Presupuestos',
                href: '/presupuestos',
                permission: 'presupuestos.index',
            },
            {
                title: 'Entregas Pendientes',
                href: '/entregas',
                icon: PackageCheck,
                permission: 'entregas.index',
            },
        ],
    },
    {
        title: 'Listas de Precios',
        href: '/listas-precios',
        icon: Tag,
        permission: 'listas-precios.index',
    },
    {
        title: 'Proveedores',
        icon: Truck,
        permission: 'orders.index',
        items: [
            {
                title: 'Proveedores',
                href: '/suppliers',
                permission: 'suppliers.index',
            },
            {
                title: 'Órdenes de Compra',
                href: '/orders',
                permission: 'orders.index',
            },
        ],
    },
    {
        title: 'IA',
        icon: Brain,
        permission: 'chat.index',
        items: [
            {
                title: 'Asistente IA',
                href: '/chat',
                permission: 'chat.index',
            },
            {
                title: 'Asistente Compras',
                href: '/asistente-compras',
                permission: 'asistente-compras.index',
            },
        ],
    },
    {
        title: 'Configuración',
        icon: Settings,
        permission: 'users.index',
        items: [
            {
                title: 'Usuarios',
                href: '/users',
                permission: 'users.index',
            },
            {
                title: 'Roles',
                href: '/roles',
                permission: 'roles.index',
            },
            {
                title: 'Empresa',
                href: '/empresa',
                permission: 'empresa.index',
            },
            {
                title: 'Almacenes',
                href: '/almacenes',
                icon: Warehouse,
                permission: 'almacenes.index',
            },
            {
                title: 'Puntos de Venta',
                href: '/puntos-venta',
                icon: Store,
                permission: 'puntos-venta.index',
            },
            {
                title: 'Registro de Actividad',
                href: '/activity-log',
                permission: 'activity-log.index',
            },
            {
                title: 'AFIP',
                href: '/settings/afip',
                permission: 'afip.settings',
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

function filterNavItems(items: NavItem[], can: (p: string) => boolean): NavItem[] {
    return items.reduce<NavItem[]>((acc, item) => {
        // Si tiene sub-items, filtrar recursivamente
        if (item.items && item.items.length > 0) {
            const filteredChildren = filterNavItems(item.items, can);
            if (filteredChildren.length > 0) {
                acc.push({ ...item, items: filteredChildren });
            }
            return acc;
        }

        // Item simple: mostrar si no requiere permiso o si lo tiene
        if (!item.permission || can(item.permission)) {
            acc.push(item);
        }
        return acc;
    }, []);
}

export function AppSidebar() {
    const { can } = usePermission();

    const filteredNavItems = filterNavItems(mainNavItems, can);

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
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
