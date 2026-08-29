import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Zone, Shelter, Hospital, RoadSegment, EvacuationRoute, ShelterAllocationItem } from '../../types';
import { MapLegend } from './MapLegend';
import { ZonePopup } from './ZonePopup';

interface RiskMapProps {
  zones: Zone[];
  shelters: Shelter[];
  hospitals: Hospital[];
  roads: RoadSegment[];
  routes: EvacuationRoute[];
  allocations: ShelterAllocationItem[];
}

export const RiskMap: React.FC<RiskMapProps> = ({
  zones,
  shelters,
  hospitals,
  roads,
  routes,
  allocations,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showRadar, setShowRadar] = useState<boolean>(true);

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '© Esri, OpenStreetMap contributors',
          },
          'radar-tiles': {
            type: 'raster',
            tiles: [
              'https://tilecache.rainviewer.com/v2/radar/now/256/{z}/{x}/{y}/2/1_1.png',
            ],
            tileSize: 256,
            attribution: '© RainViewer Live Doppler Radar',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
          {
            id: 'radar-layer',
            type: 'raster',
            source: 'radar-tiles',
            minzoom: 0,
            maxzoom: 19,
            paint: {
              'raster-opacity': 0.65,
            },
          },
        ],
      },
      center: [85.8312, 19.8135], // Center of Purva Coastal District
      zoom: 10.8,
      pitch: 30, // 3D oblique tilt for situational awareness
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      // 1. Add Zone Polygons GeoJSON Source & Layers
      const zoneGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: zones.map((z) => ({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [z.polygon_coordinates],
          },
          properties: {
            id: z.id,
            name: z.name,
            code: z.code,
            risk_score: z.risk_score,
            risk_level: z.risk_level,
          },
        })),
      };

      map.addSource('zones-source', {
        type: 'geojson',
        data: zoneGeoJSON,
      });

      // Fill layer
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones-source',
        paint: {
          'fill-color': [
            'match',
            ['get', 'risk_level'],
            'CRITICAL', '#ef4444',
            'HIGH', '#f97316',
            'WATCH', '#eab308',
            'SAFE', '#10b981',
            '#64748b',
          ],
          'fill-opacity': 0.35,
        },
      });

      // Outline layer
      map.addLayer({
        id: 'zones-outline',
        type: 'line',
        source: 'zones-source',
        paint: {
          'line-color': [
            'match',
            ['get', 'risk_level'],
            'CRITICAL', '#dc2626',
            'HIGH', '#ea580c',
            'WATCH', '#ca8a04',
            'SAFE', '#059669',
            '#475569',
          ],
          'line-width': 2.2,
          'line-opacity': 0.85,
        },
      });

      // Zone click listener
      map.on('click', 'zones-fill', (e) => {
        if (e.features && e.features[0]) {
          const zoneId = e.features[0].properties?.id;
          const found = zones.find((z) => z.id === zoneId);
          if (found) {
            setSelectedZone(found);
          }
        }
      });

      map.on('mouseenter', 'zones-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'zones-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      // 2. Add Road Network GeoJSON Source & Layer
      const roadGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: roads.map((r) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: r.coordinates,
          },
          properties: {
            id: r.id,
            name: r.name,
            status: r.status,
            flood_risk: r.flood_risk_score,
          },
        })),
      };

      map.addSource('roads-source', {
        type: 'geojson',
        data: roadGeoJSON,
      });

      map.addLayer({
        id: 'roads-line',
        type: 'line',
        source: 'roads-source',
        paint: {
          'line-color': [
            'match',
            ['get', 'status'],
            'FLOODED_CLOSED', '#ef4444',
            'MANUAL_CLOSED', '#dc2626',
            'CAUTION', '#f59e0b',
            'OPEN', '#22c55e',
            '#94a3b8',
          ],
          'line-width': 3.5,
          'line-opacity': 0.9,
        },
      });

      // 3. Add Evacuation Routes Layer
      const routeGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: routes.map((rt) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: rt.path_coordinates,
          },
          properties: {
            id: rt.id,
            from: rt.from_zone_name,
            to: rt.to_shelter_name,
            risk: rt.route_risk_level,
          },
        })),
      };

      map.addSource('routes-source', {
        type: 'geojson',
        data: routeGeoJSON,
      });

      map.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes-source',
        paint: {
          'line-color': '#06b6d4',
          'line-width': 2.5,
          'line-dasharray': [2, 2],
          'line-opacity': 0.75,
        },
      });
    });

    return () => {
      map.remove();
    };
  }, []);

  // Update GeoJSON data when state changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Update zones
    const zoneSource = map.getSource('zones-source') as maplibregl.GeoJSONSource;
    if (zoneSource) {
      zoneSource.setData({
        type: 'FeatureCollection',
        features: zones.map((z) => ({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [z.polygon_coordinates],
          },
          properties: {
            id: z.id,
            name: z.name,
            code: z.code,
            risk_score: z.risk_score,
            risk_level: z.risk_level,
          },
        })),
      });
    }

    // Update roads
    const roadSource = map.getSource('roads-source') as maplibregl.GeoJSONSource;
    if (roadSource) {
      roadSource.setData({
        type: 'FeatureCollection',
        features: roads.map((r) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: r.coordinates,
          },
          properties: {
            id: r.id,
            name: r.name,
            status: r.status,
            flood_risk: r.flood_risk_score,
          },
        })),
      });
    }

    // Update routes
    const routeSource = map.getSource('routes-source') as maplibregl.GeoJSONSource;
    if (routeSource) {
      routeSource.setData({
        type: 'FeatureCollection',
        features: routes.map((rt) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: rt.path_coordinates,
          },
          properties: {
            id: rt.id,
            from: rt.from_zone_name,
            to: rt.to_shelter_name,
            risk: rt.route_risk_level,
          },
        })),
      });
    }

    // Update markers (Shelters & Hospitals)
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (showShelters) {
      shelters.forEach((s) => {
        const el = document.createElement('div');
        el.className = 'shelter-marker-pin cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group';

        const utilColor = s.is_overloaded ? 'bg-red-500' : s.utilization_percentage > 85 ? 'bg-amber-500' : 'bg-indigo-600';

        el.innerHTML = `
          <div class="relative flex items-center justify-center w-7 h-7 rounded-full ${utilColor} border-2 border-white shadow-xl">
            <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span class="absolute -bottom-1 -right-1 text-[8px] font-mono font-bold bg-[#0b0f19] text-slate-100 px-1 rounded-full border border-slate-700">
              ${s.utilization_percentage.toFixed(0)}%
            </span>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
          <div class="text-xs space-y-1">
            <div class="font-bold text-white font-mono">${s.name}</div>
            <div class="text-slate-300">Cap: <span class="text-white font-mono font-semibold">${s.total_capacity.toLocaleString()}</span> | Projected Occ: <span class="text-cyan-400 font-mono font-semibold">${s.projected_total_occupancy.toLocaleString()}</span></div>
            <div class="text-[10px] text-slate-400">Elevation: ${s.elevation_meters}m • Safety: ${s.safety_score}%</div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([s.location.lng, s.location.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    }
  }, [zones, shelters, hospitals, roads, routes, showShelters]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('zones-fill')) {
      map.setLayoutProperty('zones-fill', 'visibility', showZones ? 'visible' : 'none');
      map.setLayoutProperty('zones-outline', 'visibility', showZones ? 'visible' : 'none');
    }
    if (map.getLayer('roads-line')) {
      map.setLayoutProperty('roads-line', 'visibility', showRoads ? 'visible' : 'none');
    }
    if (map.getLayer('routes-line')) {
      map.setLayoutProperty('routes-line', 'visibility', showRoutes ? 'visible' : 'none');
    }
    if (map.getLayer('radar-layer')) {
      map.setLayoutProperty('radar-layer', 'visibility', showRadar ? 'visible' : 'none');
    }
  }, [showZones, showRoads, showRoutes, showRadar]);

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[550px] rounded-xl overflow-hidden border border-[#212b40] shadow-2xl bg-[#090d16]">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Legend & Layer Controls */}
      <div className="absolute top-4 left-4 z-10">
        <MapLegend
          showZones={showZones}
          setShowZones={setShowZones}
          showRoads={showRoads}
          setShowRoads={setShowRoads}
          showShelters={showShelters}
          setShowShelters={setShowShelters}
          showRoutes={showRoutes}
          setShowRoutes={setShowRoutes}
          showRadar={showRadar}
          setShowRadar={setShowRadar}
        />
      </div>

      {/* Floating Selected Zone Popup Card */}
      {selectedZone && (
        <div className="absolute bottom-4 right-4 z-20">
          <ZonePopup
            zone={selectedZone}
            shelters={shelters}
            allocations={allocations}
            onClose={() => setSelectedZone(null)}
          />
        </div>
      )}

      {/* Quick Instructional Pill */}
      {!selectedZone && (
        <div className="absolute bottom-4 left-4 z-10 bg-[#0f1422]/90 border border-[#212b40] rounded-lg px-3 py-1.5 text-xs text-slate-400 font-mono shadow-md">
          💡 Click any zone polygon for localized flood exposure & shelter routing drilldown
        </div>
      )}
    </div>
  );
};
