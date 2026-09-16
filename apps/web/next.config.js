/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone is for Docker; Vercel provides its own output handling
  output:
    process.env.VERCEL || process.env.NODE_ENV !== 'production'
      ? undefined
      : 'standalone',
  transpilePackages: ['@ff/types', '@ff/calc', '@ff/validators'],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.cloudflarestream.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
    NEXT_PUBLIC_FEATURE_TRACK_B_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_TRACK_B_ENABLED ?? 'false',
  },
  async rewrites() {
    const apiOrigin = (
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3001'
    ).replace(/\/+$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
