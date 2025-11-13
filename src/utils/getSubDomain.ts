
export const getSubdomain = () => {
    const pathname = window?.location?.pathname; // e.g., "/gurukulglobal"

    // Extract the first segment after '/'
    const pathParts = pathname.split('/').filter(Boolean); // Remove empty parts

    if (pathParts.length > 0) {
        return pathParts[0] === 'superAdmin' ? 'localhost' : pathParts[0];
    }

    return 'noSubdomain';
};