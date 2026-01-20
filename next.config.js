/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Enforce ESLint during builds (reverted temporary relaxation)
    ignoreDuringBuilds: false,
  },
  images: {
    domains: [],
  },
  // Allow all hosts for Replit's proxy environment
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
