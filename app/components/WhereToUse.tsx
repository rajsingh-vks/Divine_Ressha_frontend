const items = [
  {
    id: 'spa',
    src: '/images/image1.jpg',
    title: 'Spa & Wellness',
    subtitle: 'Calm, lingering warmth',
    badge: '01',
  },
  {
    id: 'workspace',
    src: '/images/image2.jpg',
    title: 'Workspace',
    subtitle: 'Clear, focused air',
    badge: '02',
  },
  {
    id: 'car',
    src: '/images/image3.jpg',
    title: 'Car Interior',
    subtitle: 'Fresh on every drive',
    badge: '03',
  },
  {
    id: 'bathroom',
    src: '/images/image4.jpg',
    title: 'Bathroom',
    subtitle: 'Crisp after the steam',
    badge: '04',
  },
  {
    id: 'bedroom',
    src: '/images/image5.jpg',
    title: 'Bedroom',
    subtitle: 'Soft, restful nights',
    badge: '05',
  },
];

export default function WhereToUse() {
  return (
    <section className="where-to-use" aria-labelledby="where-to-use-heading">
      <div className="where-to-use-shell">
        <div className="where-to-use-header">
          <div className="where-to-use-title">
            <p className="section-label">Placement Guide</p>
            <h1 id="where-to-use-heading">
              <span>Where to use</span>
            </h1>
          </div>

          <div className="where-to-use-copy">
            <p>
              Five rooms, one atmosphere. Set it anywhere the air deserves a little more care — the scent settles in within minutes and holds all day.
            </p>
          </div>
        </div>

        <div className="where-to-use-grid">
        <article className="image-card image-card--large">
          <img src={items[0].src} alt={items[0].title} />
          <div className="image-overlay" />
          <div className="image-caption">
            <strong className="image-title">{items[0].title}</strong>
            <small className="image-sub">{items[0].subtitle}</small>
          </div>
        </article>

        <div className="where-to-use-right">
          <article className="image-card image-card--medium">
            <img src={items[1].src} alt={items[1].title} />
            <div className="image-overlay" />
            <div className="image-caption">
              <strong className="image-title">{items[1].title}</strong>
              <small className="image-sub">{items[1].subtitle}</small>
            </div>
          </article>

          <div className="small-cards-row">
            {items.slice(2).map((item) => (
              <article key={item.id} className="image-card image-card--small">
                <img src={item.src} alt={item.title} />
                <div className="image-overlay" />
                <div className="image-caption">
                  <strong className="image-title">{item.title}</strong>
                  <small className="image-sub">{item.subtitle}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
