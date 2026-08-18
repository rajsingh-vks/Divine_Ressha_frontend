import type { MetadataRoute } from 'next';
import { staticPages, buildPageUrl } from '@/lib/seo';
import { getProducts } from '@/lib/data/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.divineressha.com';
  const products = await getProducts();

  const staticRoutes = staticPages.map((path) => ({
    url: buildPageUrl(path),
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.7,
  }));

  const productRoutes = products.map((product) => ({
    url: buildPageUrl(`/products/${product.id}`),
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...staticRoutes,
    ...productRoutes,
  ];
}
