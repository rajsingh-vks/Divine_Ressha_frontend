import Image from 'next/image';

const ritualCards = [
  {
    title: 'The Bath Collection',
    description: 'Body wash and hand-cut soaps formulated with cold-pressed botanicals.',
    image: '/images/bath-collection.png',
  },
  {
    title: 'Daily Ritual',
    description: 'Brushes, bowls and body wash for a slow, sensorial shower.',
    image: '/images/daily-ritual.png',
  },
];

export default function RitualShowcase() {
  return (
    <section className="ritual-showcase" aria-label="Bath ritual collections">
      <div className="ritual-showcase-grid">
        {ritualCards.map((card) => (
          <article className="ritual-showcase-card" key={card.title}>
            <Image
              src={card.image}
              alt={card.title}
              width={1254}
              height={1254}
              className="ritual-showcase-image"
              sizes="(max-width: 720px) 100vw, 420px"
            />
            <div className="ritual-showcase-copy">
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
