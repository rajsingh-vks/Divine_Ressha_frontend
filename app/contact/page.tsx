import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Contact | Divine Ressha',
  description: 'Contact Divine Ressha support team.',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="info-page-shell">
        <section className="info-page-card">
          <p className="info-page-overline">Support</p>
          <h1>Contact Us</h1>
          <p>
            Need help with an order, return, refund, or account issue? Our team is here to assist you.
          </p>

          <div className="info-contact-grid">
            <div className="info-contact-item">
              <h2>Email</h2>
              <p>support@divineressha.com</p>
            </div>
            <div className="info-contact-item">
              <h2>Phone</h2>
              <p>+91 99307 35977</p>
            </div>
            <div className="info-contact-item">
              <h2>Business Hours</h2>
              <p>Monday to Saturday, 10:00 AM to 7:00 PM (IST)</p>
            </div>
            <div className="info-contact-item">
              <h2>Address</h2>
              <p>1601/B, Crystal Armus, Vaibhav Nagar, Chembur East, Mumbai, MH 400088 IN</p>
            </div>
          </div>

          <h2>Response Time</h2>
          <p>
            We usually reply within 24–48 business hours. For quicker resolution, include your order number and registered email.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
