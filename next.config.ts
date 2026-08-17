import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Bỏ output: 'standalone' — Vercel xử lý runtime tự động
};

export default nextConfig;