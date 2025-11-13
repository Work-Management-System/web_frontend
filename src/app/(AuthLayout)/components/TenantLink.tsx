import Link from 'next/link';
import { useEffect, useState } from 'react';

const TenantLink = ({ href, ...props }) => {
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

    const tenantHref = tenant ? `/${tenant}${href}` : href;

    return <Link href={tenantHref} {...props} />;
};

export default TenantLink;
