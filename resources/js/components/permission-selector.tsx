import { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Props {
    permissions: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

const MODULE_LABELS: Record<string, string> = {
    'activity-log': 'Activity Log',
    'admin': 'Dashboard Admin',
    'afip': 'AFIP / ARCA',
    'almacenes': 'Almacenes',
    'appearance': 'Apariencia',
    'asistente-compras': 'Asistente Compras',
    'brands': 'Marcas',
    'cart': 'Carrito',
    'categories': 'Categorías',
    'chat': 'Chat IA',
    'checkout': 'Checkout',
    'client': 'Portal Cliente',
    'customers': 'Clientes',
    'dashboard': 'Dashboard',
    'design-system': 'Design System',
    'empresa': 'Empresa',
    'entregas': 'Entregas',
    'facturas': 'Facturas',
    'inventarios': 'Inventarios',
    'listas-precios': 'Listas de Precios',
    'mercadopago': 'MercadoPago',
    'orders': 'Órdenes',
    'pagos': 'Pagos',
    'password': 'Contraseña',
    'payment': 'Pagos Ecommerce',
    'presupuestos': 'Presupuestos',
    'products': 'Productos',
    'profile': 'Perfil',
    'puntos-venta': 'Puntos de Venta',
    'roles': 'Roles',
    'scanner': 'Scanner',
    'shop': 'Tienda',
    'suppliers': 'Proveedores',
    'telegram': 'Telegram',
    'transferencias': 'Transferencias',
    'user': 'Dashboard Usuario',
    'users': 'Usuarios',
    'ventas': 'Ventas',
};

function getModule(permission: string): string {
    const dot = permission.indexOf('.');
    return dot === -1 ? permission : permission.slice(0, dot);
}

function moduleLabel(module: string): string {
    return MODULE_LABELS[module] ?? module;
}

export function PermissionSelector({ permissions, selected, onChange }: Props) {
    const groups = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const p of permissions) {
            const mod = getModule(p);
            if (!map.has(mod)) map.set(mod, []);
            map.get(mod)!.push(p);
        }
        return Array.from(map.entries()).sort((a, b) => moduleLabel(a[0]).localeCompare(moduleLabel(b[0])));
    }, [permissions]);

    const toggle = (perm: string) => {
        onChange(selected.includes(perm) ? selected.filter(p => p !== perm) : [...selected, perm]);
    };

    const toggleGroup = (perms: string[]) => {
        const allSelected = perms.every(p => selected.includes(p));
        if (allSelected) {
            onChange(selected.filter(p => !perms.includes(p)));
        } else {
            onChange([...new Set([...selected, ...perms])]);
        }
    };

    return (
        <div className="space-y-4">
            {groups.map(([module, perms]) => {
                const allChecked = perms.every(p => selected.includes(p));
                const someChecked = perms.some(p => selected.includes(p));
                return (
                    <div key={module} className="rounded-lg border p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Checkbox
                                id={`group-${module}`}
                                checked={allChecked}
                                data-state={someChecked && !allChecked ? 'indeterminate' : undefined}
                                onCheckedChange={() => toggleGroup(perms)}
                            />
                            <label htmlFor={`group-${module}`} className="cursor-pointer text-sm font-semibold">
                                {moduleLabel(module)}
                            </label>
                            <Badge variant="secondary" className="ml-auto text-xs">
                                {perms.filter(p => selected.includes(p)).length}/{perms.length}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {perms.map(perm => {
                                const action = perm.includes('.') ? perm.slice(perm.indexOf('.') + 1) : perm;
                                return (
                                    <label key={perm} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted">
                                        <Checkbox
                                            checked={selected.includes(perm)}
                                            onCheckedChange={() => toggle(perm)}
                                        />
                                        <span className="text-muted-foreground">{action}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
