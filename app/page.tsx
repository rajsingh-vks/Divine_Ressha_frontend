import type { Metadata } from 'next';
import Header from './components/Header';
import Hero from './components/Hero';
import RitualShowcase from './components/RitualShowcase';
import Overview from './components/Overview';
import ProductGrid from './components/ProductGrid';
import WhereToUse from './components/WhereToUse';
import Features from './components/Features';
import Philosophy from './components/Philosophy';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import { getProducts } from '@/lib/data/products';
import { buildPageMetadata } from '@/lib/seo';
import SeoStructuredData from './components/SeoStructuredData';

export const metadata: Metadata = buildPageMetadata({
  title: 'Divine Ressha | Botanical Body Care & Fragrance Rituals',
  description:
    'Discover Divine Ressha botanical body care, fragrance rituals, and wellness essentials made for modern self-care routines.',
  path: '/',
});

export default async function HomePage() {
  const products = await getProducts();

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Divine Ressha',
    url: 'https://www.divineressha.com',
    logo: 'https://www.divineressha.com/icons/icon-192.png',
    sameAs: ['https://www.instagram.com/divineressha'],
    description:
      'Divine Ressha offers botanical body care, lifestyle fragrances, and ritual-based self-care experiences.',
  };

  return (
    <>
      <SeoStructuredData data={organizationSchema} />
      <Header />

      <main>
        <Hero />
        <WhereToUse />

        <section className='page-shell-wrapper'>
          <Overview />
          <ProductGrid products={products} variant="home" />
        </section>

        <section className="page-shell">
          <Features />
        </section>

        <RitualShowcase />

        <section className="page-shell-wrapper philosophy-wrapper">
          <Philosophy />
        </section>

        <section className="page-shell-wrapper testimonials-wrapper">
          <Testimonials />
        </section>
      </main>

      <Footer />
    </>
  );
}
