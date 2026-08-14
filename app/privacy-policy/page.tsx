import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Divine Ressha',
  description: 'Privacy Policy for Divine Ressha.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="legal-page-shell">
        <section className="legal-hero">
          <div className="legal-hero-shell">
            <div className="legal-hero-copy">
              <p className="info-page-overline">Legal</p>
              <div className="about-hero-divider" />
              <h1>Privacy Policy</h1>
              <p>
                Your trust matters to us. This policy explains how we collect, use, and protect your information when you shop with Divine Ressha.
              </p>
            </div>

            <div className="legal-hero-panel">
              <p>Last updated</p>
              <strong>August 2026</strong>
              <span>We only use your details to support a safer, smoother experience.</span>
            </div>
          </div>
        </section>

        <section className="legal-content-section">
          <div className="legal-content-shell">
            <article className="legal-card">
              <h2>Information we collect</h2>
              <p>We collect information you provide directly, such as your name, email address, phone number, shipping details, and order preferences. We may also collect technical information, including browser type, device information, session activity, and interaction logs, to help secure and improve the website.</p>
            </article>

            <article className="legal-card">
              <h2>How we use your information</h2>
              <ul>
                <li>To create and manage your account.</li>
                <li>To process orders, delivery, returns, and refunds.</li>
                <li>To send service updates, verification messages, and support replies.</li>
                <li>To improve product offerings, website experience, and customer support.</li>
              </ul>
            </article>

            <article className="legal-card">
              <h2>Data sharing</h2>
              <p>We do not sell personal data. We may share limited information with trusted partners only where necessary for payment processing, logistics, shipping, customer communication, and legal compliance.</p>
            </article>

            <article className="legal-card">
              <h2>Retention & security</h2>
              <p>We retain personal data only as long as necessary for business, legal, and security purposes. We use reasonable safeguards to protect the information we hold and maintain appropriate operational controls to limit access and misuse.</p>
            </article>

            <article className="legal-card">
              <h2>Your rights</h2>
              <p>You may request access, correction, or deletion of your personal data, or ask us to limit how it is used. You can contact us through our support channels to exercise these rights.</p>
            </article>

            <article className="legal-card">
              <h2>Contact</h2>
              <p>For privacy-related questions, please contact us at <a href="mailto:support@divineressha.com">support@divineressha.com</a>.</p>
            </article>

            <article className="legal-card">
              <h2>Updates</h2>
              <p>This policy may be updated from time to time. Continued use of the website after changes are published means you accept the revised policy.</p>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
