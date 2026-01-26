/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Allow warnings but fail on errors during production builds
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Ensure TypeScript errors fail the build
    ignoreBuildErrors: false,
  },
  images: {
    domains: [],
    unoptimized: false, // Enable image optimization for production
  },
  // Production-ready headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  // Optimize for Vercel deployment
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
