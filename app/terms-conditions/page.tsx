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
      <main className="info-page-shell">
        <section className="info-page-card">
          <p className="info-page-overline">Legal</p>
          <h1>Terms & Conditions</h1>
          <p>
            By accessing or using Divine Ressha, you agree to these Terms & Conditions. If you do not agree, please do not use the
            website.
          </p>

          <h2>Account Responsibility</h2>
          <p>
            You are responsible for maintaining account confidentiality and for all activities under your account.
          </p>

          <h2>Orders & Payments</h2>
          <ul>
            <li>All orders are subject to acceptance and stock availability.</li>
            <li>Prices and offers may change without prior notice.</li>
            <li>Payments must be completed using approved payment methods.</li>
          </ul>

          <h2>Returns & Refunds</h2>
          <p>
            Return and refund requests are processed according to our support policy and order status eligibility.
          </p>

          <h2>Prohibited Use</h2>
          <ul>
            <li>Attempting unauthorized access to systems or data.</li>
            <li>Submitting false, misleading, or harmful content.</li>
            <li>Any activity that disrupts service availability or security.</li>
          </ul>

          <h2>Intellectual Property</h2>
          <p>
            Website content, branding, and assets are owned by Divine Ressha and may not be copied or used without permission.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            Divine Ressha is not liable for indirect, incidental, or consequential damages arising from use of the website.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We may revise these terms at any time. Continued usage after updates implies acceptance of the revised terms.
          </p>

          <h2>Contact</h2>
          <p>
            For any questions regarding these terms, contact support@divineressha.com.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
