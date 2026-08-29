import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  Zone,
  Shelter,
  Hospital,
  RoadSegment,
  EvacuationRoute,
  ShelterAllocationItem,
  HazardTelemetry,
  DistrictState
} from '../../types';
import { MapLegend, BasemapType } from './MapLegend';
import { ZonePopup } from './ZonePopup';
import { WindStreamOverlay } from './WindStreamOverlay';
import { PointInspectorPopup } from './PointInspectorPopup';
import { LocationSearchBar } from './LocationSearchBar';
import { DemographicsCard } from './DemographicsCard';
import { Users, Info } from 'lucide-react';

interface RiskMapProps {
  zones: Zone[];
  shelters: Shelter[];
  hospitals: Hospital[];
  roads: RoadSegment[];
  routes: EvacuationRoute[];
  allocations: ShelterAllocationItem[];
  hazard?: HazardTelemetry;
  fullState?: DistrictState;
  onSetSimulationFocus?: (lat: number, lng: number, locationName?: string) => void;
  isLoading?: boolean;
}

const BASEMAP_TILES: Record<BasemapType, { url: string; attribution: string }> = {
  'google-hybrid': {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '© Google Maps Satellite Hybrid',
  },
  'google-terrain': {
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '© Google Maps Terrain',
  },
  'dark': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri Dark Canvas, OpenStreetMap',
  },
};

export const RiskMap: React.FC<RiskMapProps> = ({
  zones,
  shelters,
  hospitals,
  roads,
  routes,
  allocations,
  hazard,
  fullState,
  onSetSimulationFocus,
  isLoading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const cycloneMarkerRef = useRef<maplibregl.Marker[]>([]);
  const pinpointMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [pinpointCoords, setPinpointCoords] = useState<[number, number] | null>(null);
  const [showDemographics, setShowDemographics] = useState<boolean>(false);
  const [basemap, setBasemap] = useState<BasemapType>('google-hybrid');
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showWindStreams, setShowWindStreams] = useState<boolean>(true);

  const stormLngLat: [number, number] = [
    hazard?.center_coordinates.lng || 85.8312,
    hazard?.center_coordinates.lat || 19.8135,
  ];

  // Initialize MapLibre GL map with Google Hybrid basemap
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'basemap-source': {
            type: 'raster',
            tiles: [BASEMAP_TILES['google-hybrid'].url],
            tileSize: 256,
            attribution: BASEMAP_TILES['google-hybrid'].attribution,
          },
          'radar-tiles': {
            type: 'raster',
            tiles: ['https://tilecache.rainviewer.com/v2/radar/now/256/{z}/{x}/{y}/2/1_1.png'],
            tileSize: 256,
            attribution: '© RainViewer Live Doppler Radar',
          },
        },
        layers: [
          {
            id: 'basemap-layer',
            type: 'raster',
            source: 'basemap-source',
            minzoom: 0,
            maxzoom: 20,
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
      center: stormLngLat,
      zoom: 11.2,
      pitch: 32,
      bearing: -5,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;
    setMapInstance(map);

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
          'fill-opacity': 0.38,
        },
      });

      map.addLayer({
        id: 'zones-outline',
        type: 'line',
        source: 'zones-source',
        paint: {
          'line-color': [
            'match',
            ['get', 'risk_level'],
            'CRITICAL', '#ff2222',
            'HIGH', '#ff7a00',
            'WATCH', '#ffd000',
            'SAFE', '#00e599',
            '#94a3b8',
          ],
          'line-width': 2.8,
          'line-opacity': 0.95,
        },
      });

      // Global Map Click Listener for Point Inspector Tool
      map.on('click', (e) => {
        setPinpointCoords([e.lngLat.lng, e.lngLat.lat]);
      });

      // Zone click listener (opens zone drilldown)
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
        map.getCanvas().style.cursor = 'crosshair';
      });
      map.on('mouseleave', 'zones-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      // 2. Road Network Layer
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

      // 3. Evacuation Corridors Layer
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
          'line-color': '#00f0ff',
          'line-width': 2.8,
          'line-dasharray': [2, 2],
          'line-opacity': 0.85,
        },
      });
    });

    return () => {
      map.remove();
    };
  }, []);

  // Handle Basemap switching dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('basemap-source') as maplibregl.RasterTileSource;
    if (source && (source as any).tiles) {
      const tileUrl = BASEMAP_TILES[basemap].url;
      map.removeLayer('basemap-layer');
      map.removeSource('basemap-source');

      map.addSource('basemap-source', {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution: BASEMAP_TILES[basemap].attribution,
      });

      const firstLayerId = map.getStyle().layers[0]?.id;
      map.addLayer(
        {
          id: 'basemap-layer',
          type: 'raster',
          source: 'basemap-source',
          minzoom: 0,
          maxzoom: 20,
        },
        firstLayerId
      );
    }
  }, [basemap]);

  // Handle Pinpoint Marker Creation & Movement
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pinpointMarkerRef.current) {
      pinpointMarkerRef.current.remove();
      pinpointMarkerRef.current = null;
    }

    if (pinpointCoords) {
      const el = document.createElement('div');
      el.className = 'pinpoint-crosshair flex items-center justify-center';
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="w-12 h-12 rounded-full border-2 border-cyan-400 bg-cyan-400/20 animate-ping absolute"></div>
          <div class="w-8 h-8 rounded-full border border-cyan-300 bg-[#0a1122]/90 flex items-center justify-center text-cyan-300 font-mono text-[10px] font-bold shadow-2xl">
            🎯
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(pinpointCoords)
        .addTo(map);

      pinpointMarkerRef.current = marker;
    }
  }, [pinpointCoords]);

  // Update GeoJSON & Markers
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

    // Update Shelter Markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (showShelters) {
      shelters.forEach((s) => {
        const el = document.createElement('div');
        el.className = 'shelter-marker-pin cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group';
        const utilColor = s.is_overloaded ? 'bg-red-500' : s.utilization_percentage > 85 ? 'bg-amber-500' : 'bg-indigo-600';

        el.innerHTML = `
          <div class="relative flex items-center justify-center w-7 h-7 rounded-full ${utilColor} border-2 border-white shadow-2xl">
            <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span class="absolute -bottom-1 -right-1 text-[8px] font-mono font-bold bg-[#0b0f19] text-slate-100 px-1 rounded-full border border-slate-700">
              ${s.utilization_percentage.toFixed(0)}%
            </span>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
          <div class="text-xs space-y-1 bg-[#0f1422] p-1 rounded">
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

    // Cyclone Eye Tracker Marker
    cycloneMarkerRef.current.forEach((m) => m.remove());
    cycloneMarkerRef.current = [];

    const cycloneEl = document.createElement('div');
    cycloneEl.className = 'cyclone-eye-marker flex items-center justify-center';
    cycloneEl.innerHTML = `
      <div class="relative flex items-center justify-center">
        <div class="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 animate-ping absolute"></div>
        <div class="w-24 h-24 rounded-full bg-red-600/10 border border-red-400/40 animate-pulse absolute"></div>
        <div class="relative w-8 h-8 rounded-full bg-red-950 border-2 border-red-400 text-red-300 flex items-center justify-center shadow-2xl font-mono text-[10px] font-bold">
          🌀 ${hazard?.category ? `C${hazard.category}` : 'EYE'}
        </div>
      </div>
    `;

    const cycloneMarker = new maplibregl.Marker({ element: cycloneEl })
      .setLngLat(stormLngLat)
      .addTo(map);

    cycloneMarkerRef.current.push(cycloneMarker);

    // Smoothly fly camera to new district center
    if (hazard?.center_coordinates) {
      const curCenter = map.getCenter();
      const distDeg = Math.sqrt(
        Math.pow(curCenter.lng - stormLngLat[0], 2) + Math.pow(curCenter.lat - stormLngLat[1], 2)
      );
      if (distDeg > 0.3) {
        map.flyTo({
          center: stormLngLat,
          zoom: 11.2,
          speed: 1.4,
          curve: 1.2,
          essential: true,
        });
      }
    }
  }, [zones, shelters, hospitals, roads, routes, showShelters, hazard]);

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
      <div ref={mapContainerRef} className="w-full h-full cursor-crosshair" />

      {/* Location Search Bar Floating Top Center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
        <LocationSearchBar
          onSelectLocation={(lat, lng, locName) => {
            if (onSetSimulationFocus) onSetSimulationFocus(lat, lng, locName);
          }}
          isLoading={isLoading}
        />
      </div>

      {/* Earth.NullSchool Wind Stream Particle Canvas Layer */}
      <WindStreamOverlay
        map={mapInstance}
        centerLngLat={stormLngLat}
        windSpeedKmh={hazard?.wind_speed_kmh || 85.0}
        windDirectionDeg={hazard?.wind_direction_deg || 135.0}
        windDirection={hazard?.movement_direction || 'NW'}
        isActive={showWindStreams}
      />

      {/* Floating Map Legend & Layer Controls */}
      <div className="absolute top-4 left-4 z-20">
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
          showWindStreams={showWindStreams}
          setShowWindStreams={setShowWindStreams}
          basemap={basemap}
          setBasemap={setBasemap}
        />
      </div>

      {/* Top Right Controls: Demographics Button */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        {fullState && (
          <button
            onClick={() => setShowDemographics(!showDemographics)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold shadow-2xl backdrop-blur-md border transition-all flex items-center space-x-1.5 ${
              showDemographics
                ? 'bg-cyan-600 text-slate-950 border-cyan-400'
                : 'bg-[#0d1322]/95 hover:bg-[#151f35] text-cyan-300 border-[#263553]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Demographics</span>
          </button>
        )}
      </div>

      {/* Demographics Card Popup */}
      {showDemographics && fullState && (
        <div className="absolute top-16 right-4 z-30">
          <DemographicsCard
            state={fullState}
            onClose={() => setShowDemographics(false)}
            onSelectZone={(z) => setSelectedZone(z)}
          />
        </div>
      )}

      {/* Floating Pinpoint Live Inspection HUD */}
      {pinpointCoords && !showDemographics && (
        <div className="absolute top-16 right-4 z-30">
          <PointInspectorPopup
            coordinates={pinpointCoords}
            onClose={() => setPinpointCoords(null)}
            onSetSimulationFocus={onSetSimulationFocus}
          />
        </div>
      )}

      {/* Floating Selected Zone Popup Card */}
      {selectedZone && !pinpointCoords && !showDemographics && (
        <div className="absolute bottom-4 right-4 z-30">
          <ZonePopup
            zone={selectedZone}
            shelters={shelters}
            allocations={allocations}
            onClose={() => setSelectedZone(null)}
          />
        </div>
      )}

      {/* Quick Instructional Crosshair Banner */}
      {!pinpointCoords && !selectedZone && !showDemographics && (
        <div className="absolute bottom-4 left-4 z-20 bg-[#0f1422]/90 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono shadow-2xl backdrop-blur flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>🔍 Search any city above or click anywhere on the map to inspect live weather & flood threat!</span>
        </div>
      )}
    </div>
  );
};
