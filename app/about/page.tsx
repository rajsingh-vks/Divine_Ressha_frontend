import type { Metadata } from 'next';
import Image from 'next/image';
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
      <main className="about-page-shell">
        <section className="about-hero">
          <div className="about-hero-overlay">
            <p className="info-page-overline">About Divine Ressha</p>
            <h1>Crafted for Everyday Rituals</h1>
            <p>
              We create plant-forward fragrances and care experiences that feel elegant, calming, and dependable in daily life.
            </p>
          </div>
        </section>

        <section className="page-shell-wrapper about-content-wrap">
          <div className="about-content-inner">
            <section className="info-page-card about-page-card">
              <h2>Our Mission</h2>
              <p className="about-lead">
                To craft high-quality body and home care experiences that are sensory, dependable, and rooted in wellness. We
                believe self-care should be simple to follow, delightful to use, and worthy of trust.
              </p>

              <div className="about-highlight-grid">
                <article className="about-highlight-card">
                  <span>01</span>
                  <h3>Plant-Forward Care</h3>
                  <p>Formulations designed to be effective, gentle, and practical for daily use.</p>
                </article>
                <article className="about-highlight-card">
                  <span>02</span>
                  <h3>Modern Rituals</h3>
                  <p>Elevated fragrances and textures that turn routine care into meaningful moments.</p>
                </article>
                <article className="about-highlight-card">
                  <span>03</span>
                  <h3>Trusted Quality</h3>
                  <p>Consistency from formulation to delivery, backed by reliable customer support.</p>
                </article>
              </div>
            </section>

            <section className="info-page-card about-page-card">
              <h2>Our Process Flow</h2>
              <p>From idea to your doorstep, each stage is built with care and consistency.</p>

              <div className="about-process-grid">
                <article className="about-process-card">
                  <Image src="/images/bath-collection.png" alt="Researching fragrance and ingredient inspirations" width={420} height={320} className="about-process-image" />
                  <div>
                    <strong>1. Research & Sourcing</strong>
                    <p>We identify notes, ingredients, and formats that suit modern lifestyles and daily use.</p>
                  </div>
                </article>

                <article className="about-process-card">
                  <Image src="/images/daily-ritual.png" alt="Product development and testing" width={420} height={320} className="about-process-image" />
                  <div>
                    <strong>2. Formulation & Testing</strong>
                    <p>Each blend is tested for scent balance, performance, and comfort across everyday environments.</p>
                  </div>
                </article>

                <article className="about-process-card">
                  <Image src="/images/banner_main.jpeg" alt="Packaging and quality checks" width={420} height={320} className="about-process-image" />
                  <div>
                    <strong>3. Packaging & Quality Checks</strong>
                    <p>We package every product with attention to detail and run final checks before dispatch.</p>
                  </div>
                </article>

                <article className="about-process-card">
                  <Image src="/images/banner.jpg" alt="Order fulfillment and customer support" width={420} height={320} className="about-process-image" />
                  <div>
                    <strong>4. Delivery & Support</strong>
                    <p>Your order is delivered with care, and our support team stays available after purchase.</p>
                  </div>
                </article>
              </div>

              <div className="about-signoff">
                <p>Thank you for being part of the Divine Ressha journey.</p>
              </div>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
