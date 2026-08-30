import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { apiService } from '../../services/api';

interface WindGridPoint {
  lat: number;
  lng: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  wind_gusts_kmh: number;
  cardinal: string;
  u_ms: number;
  v_ms: number;
  surface_pressure_hpa: number;
}

interface WindStreamOverlayProps {
  map: maplibregl.Map | null;
  centerLngLat: [number, number]; // [lng, lat] of map center
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
  speedMultiplier: number;
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
  const gridPointsRef = useRef<WindGridPoint[]>([]);
  const [gridStats, setGridStats] = useState<{ minSpeed: number; maxSpeed: number; stationCount: number } | null>(null);

  // 1. Fetch real-time spatial atmospheric wind grid from Open-Meteo
  useEffect(() => {
    if (!isActive || !centerLngLat) return;

    let isMounted = true;
    const fetchWindGrid = async () => {
      try {
        const data = await apiService.fetchRegionalWindGrid(centerLngLat[1], centerLngLat[0], 0.35);
        if (!isMounted) return;

        if (data.grid_points && data.grid_points.length > 0) {
          gridPointsRef.current = data.grid_points;
          const speeds = data.grid_points.map((p) => p.wind_speed_kmh);
          setGridStats({
            minSpeed: Math.min(...speeds),
            maxSpeed: Math.max(...speeds),
            stationCount: data.grid_points.length,
          });
        }
      } catch (err) {
        // Fallback to baseline point
        if (isMounted) {
          const rad = ((windDirectionDeg + 180) * Math.PI) / 180.0;
          gridPointsRef.current = [
            {
              lat: centerLngLat[1],
              lng: centerLngLat[0],
              wind_speed_kmh: windSpeedKmh,
              wind_direction_deg: windDirectionDeg,
              wind_gusts_kmh: windSpeedKmh * 1.3,
              cardinal: 'LIVE',
              u_ms: -(windSpeedKmh / 3.6) * Math.sin(rad),
              v_ms: -(windSpeedKmh / 3.6) * Math.cos(rad),
              surface_pressure_hpa: 1010.0,
            },
          ];
        }
      }
    };

    fetchWindGrid();
    return () => {
      isMounted = false;
    };
  }, [centerLngLat, isActive, windSpeedKmh, windDirectionDeg]);

  // 2. Real-time Particle Advection Physics Engine
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

    // Number of particles proportional to screen size & real meteorological activity
    const NUM_PARTICLES = Math.min(1200, Math.max(500, Math.floor((canvas.width * canvas.height) / 1100)));
    const particles: Particle[] = [];

    const initParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      age: Math.floor(Math.random() * 60),
      maxAge: 45 + Math.floor(Math.random() * 45),
      speedMultiplier: 0.85 + Math.random() * 0.3,
    });

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push(initParticle());
    }

    // Spatial Vector Interpolation (Inverse Distance Weighting across real Open-Meteo observation grid)
    const interpolateWindVector = (pixelX: number, pixelY: number): { vx: number; vy: number; speedKmh: number } => {
      const grid = gridPointsRef.current;
      if (!grid || grid.length === 0) {
        const rad = ((windDirectionDeg + 180) * Math.PI) / 180.0;
        const spd = Math.max(1.0, windSpeedKmh / 22.0);
        return { vx: Math.sin(rad) * spd, vy: -Math.cos(rad) * spd, speedKmh: windSpeedKmh };
      }

      const geo = map.unproject([pixelX, pixelY]);
      const pLng = geo.lng;
      const pLat = geo.lat;

      let totalWeight = 0;
      let sumU = 0;
      let sumV = 0;
      let sumSpeed = 0;

      for (let i = 0; i < grid.length; i++) {
        const pt = grid[i];
        const dLng = pt.lng - pLng;
        const dLat = pt.lat - pLat;
        const distSq = dLng * dLng + dLat * dLat;

        if (distSq < 0.000001) {
          const spd = Math.max(0.8, pt.wind_speed_kmh / 24.0);
          const rad = ((pt.wind_direction_deg + 180) * Math.PI) / 180.0;
          return { vx: Math.sin(rad) * spd, vy: -Math.cos(rad) * spd, speedKmh: pt.wind_speed_kmh };
        }

        const weight = 1.0 / Math.pow(distSq, 1.2);
        totalWeight += weight;
        sumU += pt.u_ms * weight;
        sumV += pt.v_ms * weight;
        sumSpeed += pt.wind_speed_kmh * weight;
      }

      const avgU = sumU / totalWeight;
      const avgV = sumV / totalWeight;
      const avgSpeed = sumSpeed / totalWeight;

      // Project physical velocity (m/s) to screen pixel displacement
      // Scale factor calibrated for smooth natural flow
      const pixelScale = Math.min(2.8, Math.max(0.6, (avgSpeed / 25.0) * 1.5));
      const magnitude = Math.sqrt(avgU * avgU + avgV * avgV);
      if (magnitude === 0) return { vx: 0, vy: 0, speedKmh: avgSpeed };

      const vx = (avgU / magnitude) * pixelScale;
      const vy = -(avgV / magnitude) * pixelScale; // Flip Y for canvas coordinates

      return { vx, vy, speedKmh: avgSpeed };
    };

    // Render Animation Loop
    const render = () => {
      // Semi-transparent fade creates authentic Earth.Nullschool streamline tails
      ctx.fillStyle = 'rgba(10, 15, 26, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const { vx, vy, speedKmh } = interpolateWindVector(p.x, p.y);

        const nextX = p.x + vx * p.speedMultiplier;
        const nextY = p.y + vy * p.speedMultiplier;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nextX, nextY);

        // Standard IMD & WMO Meteorological Color Palette
        if (speedKmh >= 89.0) {
          ctx.strokeStyle = 'rgba(217, 70, 239, 0.85)'; // Violent Gale / Storm (Purple)
          ctx.lineWidth = 2.0;
        } else if (speedKmh >= 62.0) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Gale Force (Red)
          ctx.lineWidth = 1.8;
        } else if (speedKmh >= 36.0) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)'; // Strong Breeze (Amber)
          ctx.lineWidth = 1.4;
        } else if (speedKmh >= 18.0) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)'; // Moderate Wind (Emerald)
          ctx.lineWidth = 1.2;
        } else {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'; // Light Air / Breeze (Cyan/Sky)
          ctx.lineWidth = 1.0;
        }

        ctx.stroke();

        p.x = nextX;
        p.y = nextY;
        p.age++;

        // Reset particle if aged out or off screen
        if (p.age >= p.maxAge || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
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
  }, [map, isActive, windSpeedKmh, windDirectionDeg]);

  if (!isActive) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />
      {gridStats && (
        <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center space-x-2 bg-[#0c1220]/90 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-[11px] font-mono text-cyan-300 shadow-2xl backdrop-blur">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>
            🌪️ LIVE METEOROLOGICAL WIND FIELD • {gridStats.stationCount} Stations ({gridStats.minSpeed.toFixed(0)} - {gridStats.maxSpeed.toFixed(0)} km/h)
          </span>
        </div>
      )}
    </>
  );
};
