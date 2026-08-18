'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AppMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    document.body.classList.add('app-loaded');

    return () => {
      document.body.classList.remove('app-loaded');
    };
  }, [pathname]);

  return null;
}
