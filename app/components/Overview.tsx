import { overviewContent } from '@/lib/data/content';

export default function Overview() {
  return (
    <section className="overview">
      <div>
        <p className="section-label">{overviewContent.label}</p>
        <h2>{overviewContent.title}</h2>
        <p>{overviewContent.description}</p>
      </div>
      <div className="price-tag">{overviewContent.priceTag}</div>
    </section>
  );
}
