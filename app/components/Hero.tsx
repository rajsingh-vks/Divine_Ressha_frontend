import { heroContent } from '@/lib/data/content';

export default function Hero() {
  return (
    <section 
      className="hero" 
      id="top" 
      style={{ 
        backgroundImage: `url(${heroContent.backgroundImage})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }}
    >
      <div className="hero-overlay-wrapper">
        <p className="eyebrow">{heroContent.eyebrow}</p>
        <h1>{heroContent.title}</h1>
        <div className="hero-actions">
          <a className="button" href={heroContent.buttonHref}>
            {heroContent.buttonText}
          </a>
        </div>
      </div>
    </section>
  );
}
