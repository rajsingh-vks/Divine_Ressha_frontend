import Header from './components/Header';
import Hero from './components/Hero';
import RitualShowcase from './components/RitualShowcase';
import Overview from './components/Overview';
import ProductGrid from './components/ProductGrid';
import Features from './components/Features';
import Philosophy from './components/Philosophy';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import { getProducts } from '@/lib/data/products';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await getProducts();

  return (
    <>
      <Header />

      <main>
        <Hero />
        <RitualShowcase />

        <section className='page-shell-wrapper'>
          <Overview />
          <ProductGrid products={products} />
        </section>

        <section className="page-shell">
          <Features />
        </section>

        <section className="page-shell-wrapper philosophy-wrapper">
          <Philosophy />
        </section>

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
