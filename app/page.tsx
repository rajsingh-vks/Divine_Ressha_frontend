import Header from './components/Header';
import Hero from './components/Hero';
import Overview from './components/Overview';
import ProductGrid from './components/ProductGrid';
import Features from './components/Features';
import Philosophy from './components/Philosophy';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import { products } from '@/lib/data/products';

// Enable static site generation
export const dynamic = 'force-static';

export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        <Hero />

        <section className="page-shell">
          <Overview />
        </section>

        <ProductGrid products={products} />

        <section className="page-shell">
          <Features />
        </section>

        <section className="page-shell">
          <Philosophy />
        </section>

        <section className="page-shell">
          <Newsletter />
        </section>
      </main>

      <Footer />
    </>
  );
}
