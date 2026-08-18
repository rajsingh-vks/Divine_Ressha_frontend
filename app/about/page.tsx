import type { Metadata } from 'next';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'About Divine Ressha | Botanical Rituals & Natural Wellness',
  description:
    'Learn about Divine Ressha, a botanical body care brand rooted in nature-inspired wellness and elevated daily rituals.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="about-page-shell">
        <section className="about-hero">
          <div className="about-hero-shell">
            <div className="about-hero-copy">

              <p className="info-page-overline">
                About Divine Ressha
              </p>

              <div className="about-hero-divider" />

              <div className="about-hero-title">
                <h1>
                  Crafted for
                  <br />
                  <em>everyday rituals</em>
                </h1>
              </div>

              <p className="about-hero-description">
                We create Nature-inspired fragrances and experiences that feel elegant, calming, and refreshing aroma in daily life, made in small batches with Essential Oil extracted by pure steam distillation.
              </p>

              <p className="about-hero-quote">
                “Where beauty meets healing, and life finds its true harmony.”
              </p>

            </div>

            <div className="about-hero-visual">
              <Image
                src="/images/about-hero-banner.jpg"
                alt="Amber glass room freshener bottles with lavender"
                width={1600}
                height={1104}
                className="about-hero-image"
              />
            </div>
          </div>
        </section>

        <section className="about-mission-section">
          <div className="about-mission-shell">
            <div className="about-mission-top">
              <div>
                <p className="info-page-overline">Our Mission</p>
                <div className="about-hero-divider about-mission-divider" />
              </div>
              <div className="about-mission-text">
                <p>
                  To craft high-quality body and home care experiences that are sensory, dependable, and rooted in wellness. Self-care should be simple to follow, delightful to use, and worthy of trust.
                </p>
              </div>
            </div>

            <div className="about-highlight-grid">
              <article className="about-highlight-card">
                <span>01</span>
                <h3>Plant-Forward Care</h3>
                <p>Formulations built on steam-distilled essentials — effective, gentle, and practical for daily use.</p>
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
          </div>
        </section>

        <section className="about-features-section">
          <div className="about-features-container">
            <div className="about-features-grid">
              <div className="about-feature-item">
                <span className="about-feature-number">01</span>
                <h4>Pure & natural essential oil based</h4>
              </div>
              <div className="about-feature-item">
                <span className="about-feature-number">02</span>
                <h4>Plant-derived formula</h4>
              </div>
              <div className="about-feature-item">
                <span className="about-feature-number">03</span>
                <h4>No aerosol, no harsh chemicals</h4>
              </div>
              <div className="about-feature-item">
                <span className="about-feature-number">04</span>
                <h4>Safe for kids & cruelty free</h4>
              </div>
            </div>
          </div>
        </section>

        <section className="about-process-section">
          <div className="about-process-shell">
            <div className="about-process-header">
              <p className="info-page-overline">Our Process</p>
              <h2>From idea to your doorstep</h2>
            </div>

            <div className="about-process-item">
              <div className="about-process-visual">
                <img
                  src="https://divine-about-sparkle.lovable.app/assets/process-sourcing-BfJ6ZZqk.jpg"
                  alt="Researching fragrance and ingredient inspirations"
                  className="about-process-image"
                />
              </div>

              <div className="about-process-copy">
                <span>Step 01</span>
                <h3>Research &amp; Sourcing</h3>
                <p>We identify notes, ingredients, and formats that suit modern lifestyles and daily use.</p>
              </div>
            </div>

            <div className="about-process-item about-process-item-reverse">
              <div className="about-process-visual">
                <img
                  src="https://divine-about-sparkle.lovable.app/assets/process-formulation-CcBdOupV.jpg"
                  alt="Product development and testing"
                  className="about-process-image"
                />
              </div>

              <div className="about-process-copy">
                <span>Step 02</span>
                <h3>Formulation &amp; Testing</h3>
                <p>Each blend is tested for scent balance, performance, and comfort across everyday environments.</p>
              </div>
            </div>

            <div className="about-process-item">
              <div className="about-process-visual">
                <img
                  src="https://divine-about-sparkle.lovable.app/assets/process-packaging-B57slIaZ.jpg"
                  alt="Packaging and quality checks"
                  className="about-process-image"
                />
              </div>

              <div className="about-process-copy">
                <span>Step 03</span>
                <h3>Packaging &amp; Quality Checks</h3>
                <p>Every product is packed with attention to detail and passes final checks before dispatch.</p>
              </div>
            </div>

            <div className="about-process-item about-process-item-reverse">
              <div className="about-process-visual">
                <img
                  src="https://divine-about-sparkle.lovable.app/assets/process-delivery-CANSCAI2.jpg"
                  alt="Delivery and customer support"
                  className="about-process-image"
                />
              </div>

              <div className="about-process-copy">
                <span>Step 04</span>
                <h3>Delivery &amp; Support</h3>
                <p>Your order arrives with care, and our team stays available long after purchase.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-usage-section">
          <div className="about-usage-shell">
            <div className="about-usage-header">
              <p className="about-usage-kicker">Where to use</p>
              <h2>Made for every corner of the day</h2>
            </div>

            <div className="about-usage-grid">
              <div className="about-usage-item">
                <span>Living Room</span>
              </div>
              <div className="about-usage-item">
                <span>Bedroom</span>
              </div>
              <div className="about-usage-item">
                <span>Bathroom</span>
              </div>
              <div className="about-usage-item">
                <span>Workspace</span>
              </div>
              <div className="about-usage-item">
                <span>Car</span>
              </div>
              <div className="about-usage-item">
                <span>Spa &amp; Studio</span>
              </div>
            </div>
          </div>
        </section>

        <section className="about-signoff-section">
          <div className="about-signoff-shell">
            <div className="about-signoff-divider" />
            <p className="about-signoff-copy">
              Thank you for being part of the Divine Ressha
              <br />
              journey.
            </p>
            <p className="about-signoff-meta">
              Formulated with care · Made in small batches · support@divineressha.com
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
