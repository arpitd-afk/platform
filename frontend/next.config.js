/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['storage.googleapis.com', 'amazonaws.com', 'localhost', 'api.dicebear.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || '',
    NEXT_PUBLIC_APP_NAME: 'ChessAcademy Pro',
  },
};

module.exports = nextConfig;
