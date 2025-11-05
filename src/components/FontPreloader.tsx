'use client';

import { useEffect } from 'react';

export function FontPreloader() {
  useEffect(() => {
    // Preload font using link element (adds to head for early loading)
    const existingLink = document.querySelector('link[href="/font/Art.ttf"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/ttf';
      link.crossOrigin = 'anonymous';
      link.href = '/font/Art.ttf';
      document.head.appendChild(link);
    }

    // Use FontFace API for programmatic loading with block display
    if (typeof window !== 'undefined' && 'FontFace' in window) {
      // Check if font is already loaded
      const isFontLoaded = document.fonts.check('1em Art');
      if (!isFontLoaded) {
        const fontFace = new FontFace('Art', 'url(/font/Art.ttf)', {
          display: 'block', // Block text until font loads
        });
        fontFace
          .load()
          .then(() => {
            document.fonts.add(fontFace);
          })
          .catch(() => {
            // Fallback: font will load via CSS @font-face
          });
      }
    }
  }, []);

  return null;
}

