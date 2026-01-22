import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    unoptimized: true,
    domains: [],
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  trailingSlash: false,
  output: 'standalone',
  
  // Production optimization settings to prevent 504 errors
  experimental: {
    // Reduce memory usage
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
  
  // Server configuration
  serverRuntimeConfig: {
    // API route timeout (30 seconds)
    apiTimeout: 30000,
  },
  
  // Headers for security and performance
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
        ],
      },
    ]
  },
};

export default nextConfig;
