import { useState, useEffect } from 'react';

/**
 * Hook to detect when the Art font is fully loaded
 * Uses Font Loading API for reliable detection
 */
export function useFontReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkFontReady = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Check if Font Loading API is available
        if ('fonts' in document) {
          // Wait for fonts to be ready
          await document.fonts.ready;

          // Check if Art font is loaded
          const isArtLoaded = document.fonts.check('1em Art');

          if (isArtLoaded) {
            setIsReady(true);
            return;
          }

          // If not loaded yet, try to load it explicitly
          const fontFace = new FontFace('Art', 'url(/font/Art.ttf)', {
            display: 'block',
          });

          try {
            const loadedFont = await fontFace.load();
            document.fonts.add(loadedFont);
            setIsReady(true);
          } catch (error) {
            // If explicit loading fails, wait a bit and check again
            // This handles cases where CSS @font-face loads it
            setTimeout(() => {
              const checkAgain = document.fonts.check('1em Art');
              setIsReady(checkAgain);
            }, 100);
          }
        } else {
          // Fallback for browsers without Font Loading API
          // Wait a reasonable time for font to load
          setTimeout(() => {
            setIsReady(true);
          }, 500);
        }
      } catch (error) {
        // On error, proceed anyway after a delay
        setTimeout(() => {
          setIsReady(true);
        }, 1000);
      }
    };

    checkFontReady();
  }, []);

  return isReady;
}

