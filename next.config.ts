import type { NextConfig } from 'next';

// Only use basePath when explicitly set for GitHub Pages deployment
// For local preview, don't use basePath even in production mode
const useBasePath = process.env.USE_BASE_PATH === 'true';
const basePath = useBasePath ? '/Cklee-99.github.io' : '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: basePath,
  basePath: basePath,
  webpack: (config, { dev }) => {
    if (dev) {
      config.ignoreWarnings = [/chrome-extension/, /Unknown url scheme/];
    }
    return config;
  },
};

export default nextConfig;
