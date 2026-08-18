import type { Metadata } from 'next';
import Image from 'next/image';
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
      <main className="contact-page-shell">
        <section className="contact-hero">
          <div className="contact-hero-shell">
            <div className="contact-hero-copy">
              <p className="info-page-overline">Contact us</p>
              <div className="about-hero-divider" />

              <div className="contact-hero-title">
                <h1>
                  We’re here to make your ritual feel
                  <em>easy</em>
                </h1>
              </div>

              <p className="contact-hero-description">
                Need help with an order, product question, or a quick custom enquiry? Our team responds with thoughtful support and practical guidance.
              </p>

              <div className="contact-hero-badges">
                <span>Response in 24–48 hrs</span>
                <span>Mon–Sat, 10 AM–7 PM</span>
              </div>
            </div>

            <div className="contact-hero-visual">
              <div className="contact-hero-image-wrap">
                <Image
                  src="/images/about-hero-banner.jpg"
                  alt="Divine Ressha fragrance products and lifestyle styling"
                  width={1600}
                  height={1104}
                  className="contact-hero-image"
                />
              </div>

              <div className="contact-hero-card">
                <p className="contact-card-label">Need help?</p>
                <a href="mailto:support@divineressha.com">support@divineressha.com</a>
                <a href="tel:+919930735977">+91 99307 35977</a>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-details-section">
          <div className="contact-details-shell">
            <div className="contact-details-grid">
              <article className="contact-detail-card">
                <span>Email</span>
                <h2>Write to us</h2>
                <a href="mailto:support@divineressha.com">support@divineressha.com</a>
              </article>

              <article className="contact-detail-card">
                <span>Phone</span>
                <h2>Call us</h2>
                <a href="tel:+919930735977">+91 99307 35977</a>
              </article>

              <article className="contact-detail-card">
                <span>Hours</span>
                <h2>Business hours</h2>
                <p>Monday to Saturday, 10:00 AM to 7:00 PM (IST)</p>
              </article>

              <article className="contact-detail-card">
                <span>Visit</span>
                <h2>Studio address</h2>
                <p>1601/B, Crystal Armus, Vaibhav Nagar, Chembur East, Mumbai, MH 400088 IN</p>
              </article>
            </div>
          </div>
        </section>

        {/* <section className="contact-form-section">
          <div className="contact-form-shell">
            <div className="contact-form-copy">
              <p className="info-page-overline">Write to us</p>
              <h2>Tell us what you need.</h2>
              <p>
                Share your order details, product questions, return request, or a collaboration enquiry and we’ll get back to you with the right next step.
              </p>
              <ul>
                <li>Order status and delivery support</li>
                <li>Product guidance and scent recommendations</li>
                <li>Bulk gifting and retail partnerships</li>
              </ul>
            </div>

            <form className="contact-form">
              <div className="contact-form-row">
                <label>
                  <span>Name</span>
                  <input type="text" name="name" placeholder="Your full name" />
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" name="email" placeholder="you@example.com" />
                </label>
              </div>

              <div className="contact-form-row">
                <label>
                  <span>Phone</span>
                  <input type="tel" name="phone" placeholder="+91 98xxx xxxxx" />
                </label>
                <label>
                  <span>Subject</span>
                  <input type="text" name="subject" placeholder="Order support" />
                </label>
              </div>

              <label>
                <span>Message</span>
                <textarea name="message" rows={6} placeholder="Tell us how we can help..." />
              </label>

              <button type="submit" className="contact-submit">Send message</button>
            </form>
          </div>
        </section> */}
      </main>
      <Footer />
    </>
  );
}
