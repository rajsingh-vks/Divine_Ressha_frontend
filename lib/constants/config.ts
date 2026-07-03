// Site configuration
export const SITE_CONFIG = {
  name: 'Divine Ressha',
  description: 'Luxury botanical body wash with certified organic, sulfate-free formulations',
  url: 'https://divine-ressha.com',
  ogImage: '/og-image.jpg',
  twitterHandle: '@divinressha',
};

// SEO
export const SEO = {
  defaultTitle: 'Divine Ressha - Bathe in the garden',
  titleTemplate: '%s | Divine Ressha',
  description: SITE_CONFIG.description,
  keywords: ['body wash', 'botanical', 'organic', 'natural skincare', 'luxury beauty'],
};

// Cache configuration (for static generation)
export const CACHE_CONFIG = {
  products: 3600, // 1 hour
  pages: 86400, // 24 hours
  api: 300, // 5 minutes
};

// Colors
export const COLORS = {
  primary: '#f8fafc',
  secondary: '#1a1a1a',
  accent: '#fafaf8',
  text: '#1a1a1a',
  textLight: '#5a5a5a',
  border: 'rgba(0, 0, 0, 0.08)',
};

// Breakpoints
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
};

// Animation
export const ANIMATION = {
  duration: '0.2s',
  easing: 'ease',
};
