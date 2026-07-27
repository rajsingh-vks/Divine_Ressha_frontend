import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'About Us | Divine Ressha',
  description: 'Learn about Divine Ressha.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="info-page-shell">
        <section className="info-page-card">
          <p className="info-page-overline">About</p>
          <h1>About Us</h1>
          <p>
            Divine Ressha is a modern botanical care brand focused on gentle formulations, elevated rituals, and everyday wellness.
          </p>

          <h2>Our Mission</h2>
          <p>
            To create thoughtful body care products that combine plant-forward ingredients with reliable performance and mindful
            craftsmanship.
          </p>

          <h2>What We Believe</h2>
          <ul>
            <li>Care should feel luxurious and still remain practical.</li>
            <li>Ingredients and product purpose should be clearly communicated.</li>
            <li>Customer trust is built through consistency, quality, and support.</li>
          </ul>

          <h2>Our Promise</h2>
          <p>
            Every order is handled with attention to detail—from formulation and packaging to delivery and post-purchase care.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
