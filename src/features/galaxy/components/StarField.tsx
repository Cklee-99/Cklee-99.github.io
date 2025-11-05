'use client';
import { useEffect, useMemo, useRef } from 'react';

export const StarField = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const stars = useMemo(
    () =>
      Array.from({ length: 150 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        color: ['#ffffff', '#a8d8ff', '#ffd700', '#ff6b9d', '#c8a2c8', '#87ceeb'][Math.floor(Math.random() * 6)],
      })),
    [],
  );

  const nebulaLayers = useMemo(
    () => [
      { color: 'rgba(155, 100, 255, 0.4)', left: '10%', top: '45%' },
      { color: 'rgba(255, 220, 255, 0.4)', left: '25%', top: '-30%' },
      { color: 'rgba(120, 180, 255, 0.4)', left: '30%', top: '10%' },
      { color: 'rgba(190, 120, 255, 0.4)', left: '40%', top: '20%' },
    ],
    [],
  );

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    // Add stars
    stars.forEach((star, i) => {
      const starEl = document.createElement('div');
      starEl.className = 'absolute rounded-full bg-white animate-twinkle';
      starEl.style.left = `${star.x}%`;
      starEl.style.top = `${star.y}%`;
      starEl.style.width = `${star.size}px`;
      starEl.style.height = `${star.size}px`;
      starEl.style.opacity = `${star.opacity}`;
      starEl.style.backgroundColor = `${star.color}`;
      starEl.style.animationDelay = `${i % 3}s`;
      canvasEl.appendChild(starEl);
    });

    // Add nebula layers
    nebulaLayers.forEach((layer, i) => {
      const nebulaEl = document.createElement('div');
      nebulaEl.className = 'fixed rounded-full blur-3xl';
      nebulaEl.style.width = `${600 + i * 200}px`;
      nebulaEl.style.height = `${600 + i * 200}px`;
      nebulaEl.style.left = layer.left;
      nebulaEl.style.top = layer.top;
      nebulaEl.style.background = `radial-gradient(circle at center, ${layer.color} 0%, transparent 70%)`;
      nebulaEl.style.filter = 'blur(100px)';
      nebulaEl.style.zIndex = '0';
      canvasEl.appendChild(nebulaEl);
    });

    return () => {
      canvasEl.innerHTML = '';
    };
  }, [stars, nebulaLayers]);

  return (
    <div
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#0b051a] via-[#120a2a] to-[#050312]"
      aria-hidden="true"
    />
  );
};
