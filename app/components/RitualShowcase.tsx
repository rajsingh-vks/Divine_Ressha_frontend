import { getRitualShowcaseItems } from '@/lib/data/ritualShowcase';

const ritualCards = [
  {
    id: 'fallback-1',
    title: 'The Bath Collection',
    subtitle: 'The Bath Collection',
    description: 'Body wash and hand-cut soaps formulated with cold-pressed botanicals.',
    image: '/images/bath-collection.png',
  },
  {
    id: 'fallback-2',
    title: 'Daily Ritual',
    subtitle: 'Daily Ritual',
    description: 'Brushes, bowls and body wash for a slow, sensorial shower.',
    image: '/images/daily-ritual.png',
  },
];

export default async function RitualShowcase() {
  const dbItems = await getRitualShowcaseItems();
  const activeItems = dbItems.filter((item) => item.is_active);
  const list = (activeItems.length ? activeItems : dbItems).slice(0, 2);

  const cards = list.length
    ? list.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description || item.subtitle,
        image: item.image_url,
      }))
    : ritualCards;

  return (
    <section className="ritual-showcase" aria-label="Bath ritual collections">
      <div className="ritual-showcase-grid">
        {cards.map((card) => (
          <article className="ritual-showcase-card" key={card.id}>
            <img
              src={card.image}
              alt={card.title}
              className="ritual-showcase-image"
              loading="lazy"
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
