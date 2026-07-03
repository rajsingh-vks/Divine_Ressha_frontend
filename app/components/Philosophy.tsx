import { philosophyContent } from '@/lib/data/content';

export default function Philosophy() {
  return (
    <section className="philosophy" id="ritual">
      <div className="philosophy-copy">
        <p className="section-label">{philosophyContent.label}</p>
        <h2>{philosophyContent.quote}</h2>
        <p>{philosophyContent.description}</p>
      </div>
    </section>
  );
}
