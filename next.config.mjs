const nextConfig = {
  reactStrictMode: true,
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
