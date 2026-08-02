import { heroContent } from '@/lib/data/content';
import { getHeroBanners } from '@/lib/data/heroBanners';
import { proxyImageUrl } from '@/lib/utils/imageProxy';

export default async function Hero() {
  const banners = await getHeroBanners();
  const activeBanners = banners.filter((banner) => banner.is_active);
  const selected = activeBanners.length ? activeBanners : banners;

  const secondaryBanner = selected[0] || null;

  const primary = {
    backgroundImage: heroContent.backgroundImage,
    eyebrow: heroContent.eyebrow,
    title: heroContent.title,
  };

  const secondary = {
    backgroundImage: proxyImageUrl(secondaryBanner?.image_url, heroContent.backgroundImage),
    eyebrow: secondaryBanner?.subtitle || heroContent.eyebrow,
    title: secondaryBanner?.title || heroContent.title,
  };

  return (
    <>
      {/* <section
        className="hero"
        id="top"
        style={{
          backgroundImage: `url("${primary.backgroundImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="hero-overlay-wrapper">
          <p className="eyebrow">{primary.eyebrow}</p>
          <h1>{primary.title}</h1>
          <div className="hero-actions">
            <a className="button" href={heroContent.buttonHref}>
              {heroContent.buttonText}
            </a>
          </div>
        </div>
      </section> */}

      <section
        className="hero hero-secondary"
        style={{
          backgroundImage: `url("${secondary.backgroundImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="hero-overlay-wrapper">
          <p className="eyebrow">{secondary.eyebrow}</p>
          <h1>{secondary.title}</h1>
          <div className="hero-actions">
            <a className="button" href={heroContent.buttonHref}>
              {heroContent.buttonText}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
