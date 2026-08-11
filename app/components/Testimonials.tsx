'use client';

import { useEffect, useState } from 'react';

const testimonials = [
  {
    id: 't1',
    image: '/images/banner_main.jpeg',
    quote:
      'The fragrance feels premium and calm. My skin feels clean without dryness, and the scent lingers softly all day.',
    name: 'Ananya Mehta',
    meta: 'Mumbai, India',
  },
  {
    id: 't2',
    image: '/images/bath-collection.png',
    quote:
      'I switched from imported body washes to Divine Ressha and never looked back. It feels gentle, luxurious, and honest.',
    name: 'Rohit Sharma',
    meta: 'Bengaluru, India',
  },
  {
    id: 't3',
    image: '/images/daily-ritual.png',
    quote:
      'From packaging to formulation, everything feels thoughtfully crafted. It turned my shower into a daily ritual.',
    name: 'Ira Kapoor',
    meta: 'New Delhi, India',
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section className="testimonials" aria-labelledby="testimonials-heading">
      <div className="testimonials-copy">
        <p className="section-label">TESTIMONIALS</p>
        <h2 id="testimonials-heading">Loved by our ritual community.</h2>
      </div>

      <div className="testimonials-slider" role="region" aria-label="Customer testimonials slider">
        <button
          type="button"
          className="testimonial-nav testimonial-nav-prev"
          onClick={goToPrev}
          aria-label="Previous testimonial"
        >
          ‹
        </button>

        <div className="testimonial-card">
          <div className="testimonial-card-image-wrap">
            <div className="testimonial-card-image-accent" aria-hidden="true" />
            <img
              src={activeTestimonial.image}
              alt={activeTestimonial.name}
              className="testimonial-card-image"
              loading="lazy"
            />
          </div>

          <div className="testimonial-card-content">
            <p className="testimonial-quote">“{activeTestimonial.quote}”</p>
            <div className="testimonial-author">
              <strong>{activeTestimonial.name}</strong>
              <span>{activeTestimonial.meta}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="testimonial-nav testimonial-nav-next"
          onClick={goToNext}
          aria-label="Next testimonial"
        >
          ›
        </button>
      </div>

      <div className="testimonial-dots" aria-label="Testimonial pagination">
        {testimonials.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`testimonial-dot${activeIndex === index ? ' active' : ''}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
