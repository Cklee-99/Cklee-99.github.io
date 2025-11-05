'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

export default function NotFound() {
  // Memoize star positions to prevent hydration mismatch
  const stars = useMemo(
    () =>
      Array.from({ length: 100 }, () => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        opacity: Math.random() * 0.8 + 0.2,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 5,
      })),
    [],
  );

  return (
    <div className="notfound-container">
      {/* Nebula */}
      <div className="notfound-nebula-top" />
      <div className="notfound-nebula-bottom" />

      {/* Main 404 Text */}
      <h1 className="notfound-title">404 Page not found</h1>
      <p className="notfound-subtext">The stars led you to a blank sector...</p>

      {/* Back Button */}
      <Link href="/" className="notfound-button">
        🪐 Return to Logverse
      </Link>

      {/* Starfield */}
      <div className="notfound-starfield">
        {stars.map((star, i) => (
          <motion.div
            key={i}
            className="notfound-star"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              opacity: star.opacity,
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
