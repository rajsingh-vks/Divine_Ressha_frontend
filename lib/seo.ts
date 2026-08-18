export const siteConfig = {
  name: 'Divine Ressha',
  shortName: 'Divine Ressha',
  description:
    'Divine Ressha crafts botanical body care rituals with elegant fragrances inspired by nature, wellness, and modern self-care.',
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'https://www.divineressha.com',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.divineressha.com',
  defaultLocale: 'en_IN',
  localeAlternates: ['en-US', 'en-IN'],
  keywords: [
    'Divine Ressha',
    'botanical body wash',
    'premium body care',
    'fragrance ritual',
    'plant-based body care',
    'natural skincare',
    'home fragrance',
    'wellness ritual',
    'body care India',
    'luxury bath ritual',
  ],
  openGraphImage: '/images/logo.png',
  twitterImage: '/images/logo.png',
};

export const staticPages = [
  '/',
  '/about',
  '/products',
  '/contact',
  '/privacy-policy',
  '/terms-conditions',
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-email',
];

export function buildPageUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, siteConfig.url).toString();
}

export function buildPageMetadata({
  title,
  description,
  path = '/',
  image,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}) {
  const canonical = buildPageUrl(path);
  const ogImage = image || siteConfig.openGraphImage;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: buildPageUrl(ogImage),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [buildPageUrl(ogImage)],
    },
  };
}
