import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface WindStreamOverlayProps {
  map: maplibregl.Map | null;
  centerLngLat: [number, number]; // [lng, lat] of cyclone center or focus
  windSpeedKmh: number;
  windDirectionDeg?: number;
  windDirection?: string;
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
  windDirectionDeg = 135.0,
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
    const NUM_PARTICLES = Math.min(1000, Math.max(400, Math.floor(windSpeedKmh * 8)));
    const particles: Particle[] = [];

    const initParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      age: Math.floor(Math.random() * 80),
      maxAge: 40 + Math.floor(Math.random() * 50),
      speed: 1.2 + (windSpeedKmh / 28.0) * (0.8 + Math.random() * 0.5),
    });

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push(initParticle());
    }

    // Base wind direction in radians (meteorological: degree is direction wind is coming FROM)
    // Particle flows TOWARDS (dir + 180 deg)
    const baseWindRad = ((windDirectionDeg + 180) * Math.PI) / 180.0;

    // Animation Loop
    const render = () => {
      // Nullschool streak fading trail
      ctx.fillStyle = 'rgba(10, 15, 26, 0.09)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Project storm center to screen pixels
      const centerPixel = map.project(centerLngLat);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Compute vector from particle to storm center
        const dx = centerPixel.x - p.x;
        const dy = centerPixel.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Blend uniform regional wind vector with cyclonic vortex suction
        const vortexWeight = Math.min(1.0, 500.0 / Math.max(30.0, dist));
        const vortexAngle = Math.atan2(dy, dx) + (Math.PI / 2) + 0.35; // Cyclonic inward spiral

        const vxVortex = Math.cos(vortexAngle);
        const vyVortex = Math.sin(vortexAngle);

        const vxBase = Math.sin(baseWindRad);
        const vyBase = -Math.cos(baseWindRad);

        const finalVx = (vxVortex * vortexWeight + vxBase * (1.0 - vortexWeight)) * p.speed;
        const finalVy = (vyVortex * vortexWeight + vyBase * (1.0 - vortexWeight)) * p.speed;

        const nextX = p.x + finalVx;
        const nextY = p.y + finalVy;

        // Draw particle streamline
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nextX, nextY);

        // Color mapped to real-time wind speed & vortex intensity
        const intensity = Math.min(1.0, (p.speed * 8.0) / 100.0 + vortexWeight * 0.4);
        if (intensity > 0.8) {
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.45 + intensity * 0.5})`; // Neon Red core
          ctx.lineWidth = 1.9;
        } else if (intensity > 0.5) {
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + intensity * 0.4})`; // Amber
          ctx.lineWidth = 1.5;
        } else if (intensity > 0.25) {
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.35 + intensity * 0.4})`; // Emerald
          ctx.lineWidth = 1.2;
        } else {
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.3 + intensity * 0.35})`; // Cyan
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
          dist < 12
        ) {
          particles[i] = initParticle();
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    const handleMapMove = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    map.on('movestart', handleMapMove);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      map.off('resize', resizeCanvas);
      map.off('movestart', handleMapMove);
    };
  }, [map, centerLngLat, windSpeedKmh, windDirectionDeg, isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
