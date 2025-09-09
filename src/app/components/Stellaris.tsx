'use client';

import { useEffect, useState, useMemo } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleDelay: number;
  color: string;
  type: 'normal' | 'bright';
}

export default function Stellaris() {
  const [stars, setStars] = useState<Star[]>([]);

  const starColors = useMemo(() => ['#ffffff', '#a8d8ff', '#ffd700', '#ff6b9d', '#c8a2c8', '#87ceeb'], []);

  useEffect(() => {
    // Stars
    const starCount = 500;
    const newStars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      const isBright = Math.random() < 0.12;
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: isBright ? Math.random() * 3 + 3 : Math.random() * 2 + 0.5,
        brightness: isBright ? Math.random() * 0.4 + 0.6 : Math.random() * 0.5 + 0.3,
        twinkleDelay: Math.random() * 4,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        type: isBright ? 'bright' : 'normal',
      });
    }
    setStars(newStars);
  }, [starColors]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Sky Background with larger size and slow rotation for time-lapse feel */}
      <div
        className="absolute animate-sky-rotate"
        style={{
          width: '200%',
          height: '200%',
          top: '-50%',
          left: '-50%',
          background: `
            radial-gradient(ellipse 80% 50% at 50% 20%, rgba(139, 69, 255, 0.10) 5%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 30% 35%, rgba(255, 105, 180, 0.08) 5%, transparent 45%),
            radial-gradient(ellipse 100% 30% at 70% 45%, rgba(75, 0, 130, 0.12) 5%, transparent 60%),
            linear-gradient(180deg, #0f172a 0%, #162856 50%, #0f172a 100%)
          `,
          transformOrigin: '50% 50%',
        }}
      >
        {/* Main stars */}
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full animate-twinkle"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              backgroundColor: s.color,
              opacity: s.brightness,
              boxShadow: s.type === 'bright' ? `0 0 ${s.size * 2}px ${s.color}, 0 0 ${s.size * 4}px ${s.color}` : `0 0 ${s.size}px ${s.color}`,
              animationDelay: `${s.twinkleDelay}s`,
              animationDuration: '3s',
            }}
          />
        ))}

        {/* Smaller parallax stars for depth */}
        {stars.slice(0, 120).map((s) => (
          <div
            key={`small-${s.id}`}
            className="absolute rounded-full"
            style={{
              left: `${(s.x + 50) % 100}%`,
              top: `${(s.y + 35) % 100}%`,
              width: `${s.size * 0.45}px`,
              height: `${s.size * 0.45}px`,
              backgroundColor: s.color,
              opacity: s.brightness * 0.45,
              boxShadow: `0 0 ${s.size * 0.9}px ${s.color}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
