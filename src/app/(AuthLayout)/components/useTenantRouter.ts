import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const useTenantRouter = () => {
    const router = useRouter();
    const [tenant, setTenant] = useState('');

    useEffect(() => {
        const tenantCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('tenant='))
            ?.split('=')[1];

        if (tenantCookie) {
            setTenant(tenantCookie);
        }
    }, []);

    const push = (href: string, as?: any) => {
        const tenantHref = tenant ? `/${tenant}${href}` : href;
        if (as) {
            router.push(tenantHref, as);
        } else {
            router.push(tenantHref);
        }
    };

    return { ...router, push };
};

export default useTenantRouter;
