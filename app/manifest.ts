import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.divineressha.com';

  return {
    name: 'Divine Ressha',
    short_name: 'Divine Ressha',
    description: 'Botanical fragrance ritual body care and wellness essentials.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f0e7',
    theme_color: '#2f4d3d',
    lang: 'en',
    id: '/',
    orientation: 'portrait',
    icons: [
      {
        src: '/images/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    scope: siteUrl,
  };
}
