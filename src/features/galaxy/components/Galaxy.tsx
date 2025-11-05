'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import categories from '@/data/categories.json';
import Image from 'next/image';

export const Galaxy = () => {
  const router = useRouter();
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);
  const [pauseAnimation, setPauseAnimation] = useState(false);

  const lastMouseAngle = useRef<number | null>(null);
  const galaxyRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const velocityRef = useRef(0);
  const lastUpdateTime = useRef(Date.now());

  // Memoize orbits configuration
  const orbits = useMemo(
    () => [
      { radius: 180, planets: categories.slice(0, 3), showHover: true, startAngle: 0 },
      { radius: 280, planets: categories.slice(3, 6), showHover: true, startAngle: 45 },
      { radius: 380, planets: categories.slice(6, 10), showHover: true, startAngle: 90 },
    ],
    [],
  );

  // Memoize planet positions calculation
  const planetPositions = useMemo(() => {
    const positions: Array<{
      x: number;
      y: number;
      category: (typeof categories)[0];
      orbit: (typeof orbits)[0];
    }> = [];

    orbits.forEach((orbit) => {
      orbit.planets.forEach((category, planetIndex) => {
        const angle = orbit.startAngle + (planetIndex / orbit.planets.length) * 360;
        const angleRad = (angle * Math.PI) / 180;
        const x = Math.cos(angleRad) * orbit.radius;
        const y = Math.sin(angleRad) * orbit.radius;
        positions.push({ x, y, category, orbit });
      });
    });

    return positions;
  }, [orbits]);

  // Mouse down handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setPauseAnimation(true);
    velocityRef.current = 0;

    if (galaxyRef.current) {
      const rect = galaxyRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      lastMouseAngle.current = angle;
    }
  }, []);

  // Mouse move handler with velocity tracking
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !galaxyRef.current) return;

      const rect = galaxyRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      const prevAngle = lastMouseAngle.current ?? currentAngle;

      let deltaAngle = currentAngle - prevAngle;

      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      // Track velocity for momentum
      const now = Date.now();
      const deltaTime = now - lastUpdateTime.current;
      velocityRef.current = deltaTime > 0 ? deltaAngle / deltaTime : 0;
      lastUpdateTime.current = now;

      setRotation((prev) => prev + deltaAngle);
      lastMouseAngle.current = currentAngle;
    },
    [isDragging],
  );

  // Mouse up handler with momentum
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastMouseAngle.current = null;

    // Add momentum effect
    const velocity = velocityRef.current;
    if (Math.abs(velocity) > 0.01) {
      let currentVelocity = velocity * 10;
      const momentumAnimation = () => {
        currentVelocity *= 0.95; // Friction

        if (Math.abs(currentVelocity) > 0.05) {
          setRotation((prev) => prev + currentVelocity);
          requestAnimationFrame(momentumAnimation);
        } else {
          setPauseAnimation(false);
        }
      };
      requestAnimationFrame(momentumAnimation);
    } else {
      setPauseAnimation(false);
    }
  }, []);

  // Wheel handler with debouncing
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0008;
    setScale((prev) => Math.max(0.5, Math.min(1.5, prev + delta)));
  }, []);

  // Handle planet click
  const handlePlanetClick = useCallback(
    (route: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(route);
    },
    [router],
  );

  // Client-side mounting
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, handleMouseUp]);

  // Auto-rotation animation with requestAnimationFrame
  useEffect(() => {
    const animateRotation = () => {
      if (!pauseAnimation && !isDragging) {
        setRotation((prev) => prev + 0.05);
      }
      animationFrameRef.current = requestAnimationFrame(animateRotation);
    };

    animationFrameRef.current = requestAnimationFrame(animateRotation);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [pauseAnimation, isDragging]);

  if (!hasMounted) return null;

  return (
    <div
      ref={galaxyRef}
      className="galaxy-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ touchAction: 'none' }}
    >
      {/* Rotating layer with orbits and planet placeholders */}
      <div
        className="galaxy-rotating-layer"
        style={{
          transform: `rotate(${rotation}deg) scale(${scale})`,
          willChange: isDragging ? 'transform' : 'auto',
        }}
      >
        {/* Sun */}
        <div className="galaxy-sun">
          <div className="galaxy-sun-inner">
            <Image src="/images/Sun.png" alt="Sun" fill className="galaxy-sun-image" priority draggable={false} quality={90} />
          </div>
        </div>

        {/* Orbits */}
        {orbits.map((orbit, orbitIndex) => (
          <div
            key={orbitIndex}
            className="galaxy-orbit"
            style={{
              width: orbit.radius * 2,
              height: orbit.radius * 2,
            }}
          >
            {/* Orbit path */}
            <div className="galaxy-orbit-path"></div>

            {/* Planets on this orbit - using transform for better performance */}
            {orbit.planets.map((category, planetIndex) => {
              const angle = (planetIndex / orbit.planets.length) * 360;
              const angleRad = (angle * Math.PI) / 180;
              const x = Math.cos(angleRad) * orbit.radius;
              const y = Math.sin(angleRad) * orbit.radius;

              return (
                <div
                  key={category.route}
                  className="galaxy-planet-placeholder"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${-rotation}deg)`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Emoji buttons layer */}
      <div
        className="galaxy-emoji-layer"
        style={{
          transform: `scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
        }}
      >
        {planetPositions.map(({ x, y, category, orbit }) => {
          const angleRad = Math.atan2(y, x);
          const distance = Math.sqrt(x * x + y * y);
          const rotatedAngle = angleRad + (rotation * Math.PI) / 180;
          const rotatedX = Math.cos(rotatedAngle) * distance;
          const rotatedY = Math.sin(rotatedAngle) * distance;

          return (
            <button
              key={category.route}
              onClick={handlePlanetClick(category.route)}
              className={`galaxy-planet-btn ${orbit.showHover ? 'group' : ''}`}
              style={{
                transform: `translate(${rotatedX}px, ${rotatedY}px)`,
                willChange: isDragging ? 'transform' : 'auto',
              }}
              aria-label={`Go to ${category.label}`}
            >
              {/* Planet glow effect */}
              {orbit.showHover && <div className="galaxy-planet-glow" />}

              {/* Emoji content */}
              <div className="galaxy-planet-emoji">
                <span className="galaxy-planet-emoji-text planet-emoji">{category.emoji}</span>
              </div>

              {/* Label */}
              <div className="galaxy-planet-label">
                <span className="galaxy-planet-label-text">{category.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
