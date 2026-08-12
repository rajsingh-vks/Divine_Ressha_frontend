import Header from './components/Header';
import Hero from './components/Hero';
import RitualShowcase from './components/RitualShowcase';
import Overview from './components/Overview';
import ProductGrid from './components/ProductGrid';
import WhereToUse from './components/WhereToUse';
import Features from './components/Features';
import Philosophy from './components/Philosophy';
import Testimonials from './components/Testimonials';
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
        <WhereToUse />

        <section className='page-shell-wrapper'>
          <Overview />
          <ProductGrid products={products} />
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

        {/* <Newsletter /> */}
      </main>

      <Footer />
    </>
  );
}
