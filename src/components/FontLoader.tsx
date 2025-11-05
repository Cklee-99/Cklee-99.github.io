'use client';

import { ReactNode } from 'react';
import { useFontReady } from '@/hooks/use-font-ready';

interface FontLoaderProps {
  children: ReactNode;
}

export function FontLoader({ children }: FontLoaderProps) {
  const isFontReady = useFontReady();

  if (!isFontReady) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#0F0B1E] via-[#140C2A] to-[#1A103D]">
        {/* Loading Animation */}
        <div className="text-center">
          {/* Spinning galaxy icon or loading indicator */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 border-r-purple-400 animate-spin"></div>
            <div
              className="absolute inset-2 rounded-full border-4 border-transparent border-b-blue-400 border-l-blue-400 animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
            ></div>
          </div>

          {/* Loading text with Art font */}
          <p className="text-lg text-white/80" style={{ fontFamily: 'Art, Arial, sans-serif' }}>
            Loading Logverse...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

