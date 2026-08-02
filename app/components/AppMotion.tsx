'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const TARGET_SELECTOR = [
  'main > section',
  'main > div',
  'main > article',
  '.page-shell',
  '.page-shell-wrapper',
  '.auth-card',
  '.admin-main',
].join(',');

export default function AppMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    document.body.classList.add('app-loaded');

    const elements = Array.from(document.querySelectorAll<HTMLElement>(TARGET_SELECTOR));

    if (!elements.length) return;

    elements.forEach((element, index) => {
      element.classList.add('reveal-on-scroll');
      element.style.setProperty('--reveal-delay', `${Math.min(index * 50, 300)}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
