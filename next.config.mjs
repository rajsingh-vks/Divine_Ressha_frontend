const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ...(isProduction
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
            : []),
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'world-cart-bloom.lovable.app',
      },
      {
        protocol: 'https',
        hostname: 'divine-reesha-assets.s3.ap-south-1.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: '13.126.80.31',
      },
    ],
  },
};

export default nextConfig;
