import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface WindStreamOverlayProps {
  map: maplibregl.Map | null;
  centerLngLat: [number, number]; // [lng, lat] of cyclone center or focus
  windSpeedKmh: number;
  windDirection: string;
  isActive: boolean;
}

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  speed: number;
}

export const WindStreamOverlay: React.FC<WindStreamOverlayProps> = ({
  map,
  centerLngLat,
  windSpeedKmh,
  isActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!map || !canvasRef.current || !isActive) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = map.getContainer().getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    map.on('resize', resizeCanvas);

    // Particle settings
    const NUM_PARTICLES = 750;
    const particles: Particle[] = [];

    const initParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      age: Math.floor(Math.random() * 80),
      maxAge: 60 + Math.floor(Math.random() * 60),
      speed: 1.5 + (windSpeedKmh / 40.0) * (0.8 + Math.random() * 0.6),
    });

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push(initParticle());
    }

    // Animation Loop
    const render = () => {
      // Nullschool fading trail effect
      ctx.fillStyle = 'rgba(10, 15, 26, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Project storm center to screen pixels
      const centerPixel = map.project(centerLngLat);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Compute vector from particle to cyclone center
        const dx = centerPixel.x - p.x;
        const dy = centerPixel.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Cyclonic vortex math: tangential velocity + inward radial inflow (25 deg spiral)
        const angle = Math.atan2(dy, dx);
        const spiralAngle = angle + (Math.PI / 2) + 0.38; // Counter-clockwise Northern Hemisphere cyclone spiral

        // Velocity components
        const vx = Math.cos(spiralAngle) * p.speed;
        const vy = Math.sin(spiralAngle) * p.speed;

        const nextX = p.x + vx;
        const nextY = p.y + vy;

        // Draw particle trail
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nextX, nextY);

        // Color based on proximity / intensity (like earth.nullschool.net)
        const intensity = Math.min(1.0, 400.0 / Math.max(50.0, dist));
        if (intensity > 0.75) {
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + intensity * 0.5})`; // Neon Red core
          ctx.lineWidth = 1.8;
        } else if (intensity > 0.45) {
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + intensity * 0.4})`; // Amber
          ctx.lineWidth = 1.4;
        } else if (intensity > 0.25) {
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.3 + intensity * 0.4})`; // Emerald
          ctx.lineWidth = 1.2;
        } else {
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.25 + intensity * 0.35})`; // Cyan breeze
          ctx.lineWidth = 1.0;
        }

        ctx.stroke();

        p.x = nextX;
        p.y = nextY;
        p.age++;

        // Reset if aged out or out of bounds or sucked into eye
        if (
          p.age >= p.maxAge ||
          p.x < 0 ||
          p.x > canvas.width ||
          p.y < 0 ||
          p.y > canvas.height ||
          dist < 15
        ) {
          particles[i] = initParticle();
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    const handleMapMove = () => {
      // Clear slightly faster during map pan
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    map.on('movestart', handleMapMove);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      map.off('resize', resizeCanvas);
      map.off('movestart', handleMapMove);
    };
  }, [map, centerLngLat, windSpeedKmh, isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
