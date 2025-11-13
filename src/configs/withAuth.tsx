"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppselector } from '@/redux/store';
import useTenantRouter from '@/app/(AuthLayout)/components/useTenantRouter';

const ProtectedRoute = ({ children, requiredAbilities }: any) => {
    const router = useTenantRouter();
    const rolePermissionDetails  = useAppselector((state: any) => state.role.value);
    const hasPermission = (requiredAbilities: any[]) => {
        if (!rolePermissionDetails?.modules) return false;
        return requiredAbilities.every(([action, modulePath]: any) => {
            const pathParts = modulePath.split('/');
            const baseModule = pathParts[0];

            const module = rolePermissionDetails.modules.find((mod: any) =>
                mod.key === baseModule
            );
            if (!module) return false;
            if (action === 'create' && /add/.test(modulePath)) {
                return module?.permissions['create'] || module?.permissions['add'];
            }
            if ((action === 'edit' || action === 'update') && /^\w+\/\d+$/.test(modulePath)) {
                return module?.permissions['edit'] || module?.permissions['update'];
            }
            return module[action];
        });
    };

    const canAccess = hasPermission(requiredAbilities);
    useEffect(() => {
        if (!canAccess) {
            router.replace('/page-not-found');
        }
    }, [canAccess, router]);

    if (!canAccess) {
        return null;
    }

    return children;
};

export default ProtectedRoute;
