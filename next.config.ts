import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Cklee-99.github.io' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/Cklee-99.github.io' : '',
};

export default nextConfig;
