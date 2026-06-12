import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { auth } = usePage<any>().props;
    const permissions: string[] = auth?.permissions ?? [];

    const can = (permission: string): boolean => {
        return auth?.is_superadmin || permissions.includes(permission);
    };

    return {
        can,
        permissions,
        isVendedor: auth?.is_vendedor ?? false,
        isAdmin: auth?.is_admin ?? false,
        isSuperadmin: auth?.is_superadmin ?? false,
    };
}
