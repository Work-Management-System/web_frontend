/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'manazeit.sgp1.digitaloceanspaces.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'manazeit.sgp1.digitaloceanspaces.com',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Allow unoptimized images for external URLs
  },
};

module.exports = nextConfig;
