import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'docs',
  reactStrictMode: true,
};

export default nextConfig;
