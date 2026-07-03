'use client';

import { newsletterContent } from '@/lib/data/content';

export default function Newsletter() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter subscription submitted');
  };

  return (
    <section className="newsletter" id="journal">
      <div className="newsletter-copy">
        <p className="section-label">{newsletterContent.label}</p>
        <h2>{newsletterContent.title}</h2>
      </div>
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder={newsletterContent.placeholderText} 
          aria-label="Email address" 
          required 
        />
        <button type="submit">{newsletterContent.buttonText}</button>
      </form>
    </section>
  );
}
