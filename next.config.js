/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
  // Simplify experimental features
  experimental: {
    // Remove turbo configurations as they might cause issues
  },
  // Other standard configuration
  reactStrictMode: true,
};

module.exports = nextConfig;