import { features } from '@/lib/data/features';

export default function Features() {
  return (
    <section className="feature-grid">
      {features.map((feature) => (
        <div key={feature.id} className="feature-card">
          <span>{feature.value}</span>
          <p>{feature.label}</p>
        </div>
      ))}
    </section>
  );
}
