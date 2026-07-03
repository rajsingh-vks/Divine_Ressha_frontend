export interface HeroContent {
  eyebrow: string;
  title: string;
  buttonText: string;
  buttonHref: string;
  backgroundImage: string;
}

export interface OverviewContent {
  label: string;
  title: string;
  description: string;
  priceTag: string;
}

export interface PhilosophyContent {
  label: string;
  quote: string;
  description: string;
}

export interface NewsletterContent {
  label: string;
  title: string;
  placeholderText: string;
  buttonText: string;
}

export const heroContent: HeroContent = {
  eyebrow: 'CERTIFIED ORGANIC · SULFATE FREE',
  title: 'Bathe in the garden.',
  buttonText: 'SHOP THE RITUAL',
  buttonHref: '#shop',
  backgroundImage: '/images/banner.jpg',
};

export const overviewContent: OverviewContent = {
  label: 'Maison Botanical Body Wash',
  title: 'Slow rituals with botanical fragrance.',
  description:
    'One signature body wash, four fragrances, plant-derived cleansers and slow-made rituals for everyday care.',
  priceTag: '$38 · EACH',
};

export const philosophyContent: PhilosophyContent = {
  label: 'OUR PHILOSOPHY',
  quote: '"The shower is where the day begins and ends. We made it smell like a garden."',
  description:
    'Divine Ressha was born in a small apothecary, blending wildcrafted botanicals with plant-based cleansers. One body wash, four fragrances — each honest, traceable and made in small batches.',
};

export const newsletterContent: NewsletterContent = {
  label: 'The Apothecary Letter',
  title: 'Seasonal rituals, ingredient stories and first access to new harvests.',
  placeholderText: 'Enter your email',
  buttonText: 'SUBSCRIBE',
};
