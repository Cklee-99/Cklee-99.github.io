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

  // Helper function to calculate angle from coordinates
  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    if (!galaxyRef.current) return null;
    const rect = galaxyRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  }, []);

  // Mouse down handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setPauseAnimation(true);
    velocityRef.current = 0;

    const angle = calculateAngle(e.clientX, e.clientY);
    if (angle !== null) {
      lastMouseAngle.current = angle;
    }
  }, [calculateAngle]);

  // Handle move with coordinates (shared by mouse and touch)
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;

      const currentAngle = calculateAngle(clientX, clientY);
      if (currentAngle === null) return;

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
    [isDragging, calculateAngle],
  );

  // Mouse move handler with velocity tracking
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    [handleMove],
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

  // Touch start handler
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Only handle single touch
      if (e.touches.length !== 1) return;

      // Don't start dragging if touching a button
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;

      const touch = e.touches[0];
      setIsDragging(true);
      setPauseAnimation(true);
      velocityRef.current = 0;

      const angle = calculateAngle(touch.clientX, touch.clientY);
      if (angle !== null) {
        lastMouseAngle.current = angle;
      }
    },
    [calculateAngle],
  );

  // Touch move handler
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Only handle single touch
      if (e.touches.length !== 1) return;

      e.preventDefault(); // Prevent scrolling
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    [handleMove],
  );

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  // Handle planet click/touch
  const handlePlanetClick = useCallback(
    (route: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(route);
    },
    [router],
  );

  // Handle planet touch (separate from drag)
  const handlePlanetTouch = useCallback(
    (route: string) => (e: React.TouchEvent) => {
      // Only handle if it's a tap (not a drag)
      if (e.touches.length === 0 || e.changedTouches.length === 1) {
        e.stopPropagation();
        e.preventDefault();
        router.push(route);
      }
    },
    [router],
  );

  // Client-side mounting
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Global mouse up and touch end listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalTouchEnd);
    window.addEventListener('touchcancel', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
              onTouchEnd={handlePlanetTouch(category.route)}
              className={`galaxy-planet-btn ${orbit.showHover ? 'group' : ''}`}
              style={{
                transform: `translate(${rotatedX}px, ${rotatedY}px)`,
                willChange: isDragging ? 'transform' : 'auto',
                touchAction: 'manipulation',
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
