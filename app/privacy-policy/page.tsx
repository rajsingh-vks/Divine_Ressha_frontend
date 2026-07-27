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
      <main className="info-page-shell">
        <section className="info-page-card">
          <p className="info-page-overline">Legal</p>
          <h1>Privacy Policy</h1>
          <p>
            This Privacy Policy explains how Divine Ressha collects, uses, and protects your information when you use our website.
          </p>

          <h2>Information We Collect</h2>
          <ul>
            <li>Account details such as name, email address, and phone number.</li>
            <li>Order and payment-related information required to process purchases.</li>
            <li>Technical data like browser, device, and interaction logs for analytics and security.</li>
          </ul>

          <h2>How We Use Information</h2>
          <ul>
            <li>To create and manage your account.</li>
            <li>To process orders, returns, and refunds.</li>
            <li>To send service updates, verification messages, and support replies.</li>
            <li>To improve platform experience and product offerings.</li>
          </ul>

          <h2>Data Sharing</h2>
          <p>
            We do not sell personal data. We may share limited information with trusted partners only for payment processing,
            logistics, communications, and legal compliance.
          </p>

          <h2>Data Retention & Security</h2>
          <p>
            We retain data only as long as necessary for business, legal, and security purposes. Reasonable technical and
            organizational safeguards are used to protect your information.
          </p>

          <h2>Your Rights</h2>
          <p>
            You may request access, correction, or deletion of your personal data by contacting us through our support channels.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy-related questions, contact us at support@divineressha.com.
          </p>

          <h2>Updates</h2>
          <p>
            This policy may be updated from time to time. Continued use of the website after updates means you accept the revised
            policy.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
