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
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
  // Optimize for Vercel deployment
  compress: true,
  poweredByHeader: false,
  // Webpack configuration to handle optional native modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize swisseph/sweph to avoid bundling issues
      // These are native modules that will be loaded dynamically at runtime if available
      config.externals = config.externals || [];
      config.externals.push({
        sweph: 'commonjs sweph',
        swisseph: 'commonjs swisseph',
      });
    }
    
    // Ignore swisseph module resolution failures during build
    // It's optional and loaded dynamically at runtime
    config.resolve.fallback = {
      ...config.resolve.fallback,
      sweph: false,
      swisseph: false,
    };
    
    // Suppress module not found warnings for optional dependencies
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Module not found: Can't resolve 'swisseph'/,
      /Module not found: Can't resolve 'sweph'/,
    ];
    
    return config;
  },
};

module.exports = nextConfig;
