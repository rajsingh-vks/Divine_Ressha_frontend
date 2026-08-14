import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Divine Ressha',
  description: 'Terms and Conditions for Divine Ressha.',
};

export default function TermsConditionsPage() {
  return (
    <>
      <Header />
      <main className="legal-page-shell">
        <section className="legal-hero">
          <div className="legal-hero-shell">
            <div className="legal-hero-copy">
              <p className="info-page-overline">Legal</p>
              <div className="about-hero-divider" />
              <h1>Terms & Conditions</h1>
              <p>
                By accessing or using Divine Ressha, you agree to the following terms. Please read them carefully before placing an order or using our services.
              </p>
            </div>

            <div className="legal-hero-panel">
              <p>Effective from</p>
              <strong>August 2026</strong>
              <span>These terms protect both our customers and the experience we deliver.</span>
            </div>
          </div>
        </section>

        <section className="legal-content-section">
          <div className="legal-content-shell">
            <article className="legal-card">
              <h2>Account responsibility</h2>
              <p>You are responsible for maintaining the confidentiality of your account information and for all activity that occurs under your account.</p>
            </article>

            <article className="legal-card">
              <h2>Orders & payments</h2>
              <ul>
                <li>All orders are subject to acceptance and stock availability.</li>
                <li>Prices, offers, and promotions may change without prior notice.</li>
                <li>Payments must be completed using approved methods available on the website.</li>
              </ul>
            </article>

            <article className="legal-card">
              <h2>Returns & refunds</h2>
              <p>Return and refund requests are processed according to our support policy, product condition, and order status eligibility. We reserve the right to approve or decline requests in line with applicable policy.</p>
            </article>

            <article className="legal-card">
              <h2>Prohibited use</h2>
              <ul>
                <li>Attempting unauthorized access to systems or data.</li>
                <li>Submitting false, misleading, or harmful content.</li>
                <li>Any activity that interferes with site availability, safety, or security.</li>
              </ul>
            </article>

            <article className="legal-card">
              <h2>Intellectual property</h2>
              <p>All website content, branding, design, images, and related materials are owned by Divine Ressha. These materials may not be copied, republished, or used without prior written permission.</p>
            </article>

            <article className="legal-card">
              <h2>Limitation of liability</h2>
              <p>Divine Ressha is not liable for indirect, incidental, or consequential damages arising from the use of the website or products, except to the extent required by applicable law.</p>
            </article>

            <article className="legal-card">
              <h2>Changes to terms</h2>
              <p>We may revise these Terms & Conditions from time to time. Continued use of the website after changes are posted means you accept the updated terms.</p>
            </article>

            <article className="legal-card">
              <h2>Contact</h2>
              <p>If you have any questions about these terms, please contact us at <a href="mailto:support@divineressha.com">support@divineressha.com</a>.</p>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
