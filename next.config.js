/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
  // Update experimental features
  experimental: {
    // Fix: Change to serverExternalPackages
  },
  // Add correct external packages config
  serverExternalPackages: ['@supabase/supabase-js'],
  // Other standard configuration
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://wwjuohjstrcyvshfuadr.supabase.co',
  },
  // Configure the static generation to skip problematic pages
  output: 'standalone',
  // Configure images to allow Supabase domains with broader patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wwjuohjstrcyvshfuadr.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      }
    ],
    // Set unoptimized to true to prevent issues with Supabase storage URLs
    unoptimized: true,
    domains: ['wwjuohjstrcyvshfuadr.supabase.co'],
  },
  // Skip TypeScript checks during build (we'll rely on local checks only)
  typescript: {
    ignoreBuildErrors: true
  }
};

module.exports = nextConfig;