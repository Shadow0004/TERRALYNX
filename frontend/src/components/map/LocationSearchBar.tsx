import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation, Compass, Globe, Crosshair } from 'lucide-react';

export interface SearchResultItem {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  address?: {
    city?: string;
    town?: string;
    state_district?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

interface LocationSearchBarProps {
  onSelectLocation: (lat: number, lng: number, locationName: string) => void;
  isLoading?: boolean;
}

const PRESET_LOCATIONS = [
  { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, state: 'Odisha' },
  { name: 'Puri Coast', lat: 19.8135, lng: 85.8312, state: 'Odisha' },
  { name: 'Cuttack', lat: 20.4625, lng: 85.8828, state: 'Odisha' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  { name: 'Mumbai', lat: 18.9220, lng: 72.8347, state: 'Maharashtra' },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
];

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  onSelectLocation,
  isLoading = false,
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search with Nominatim OpenStreetMap Search API
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query.trim()
        )}&format=json&addressdetails=1&limit=6`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'TerraLynx-DisasterOps/2.0 (admin@terralynx.gov)',
          },
        });
        if (res.ok) {
          const data: SearchResultItem[] = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (e) {
        console.error('Failed to search location:', e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResultItem) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const district =
      item.address?.state_district ||
      item.address?.city ||
      item.address?.town ||
      item.address?.county ||
      item.display_name.split(',')[0];
    const state = item.address?.state || '';
    const cleanName = state ? `${district}, ${state}` : district;

    setQuery(cleanName);
    setIsOpen(false);
    onSelectLocation(lat, lng, cleanName);
  };

  const handleSelectPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setQuery(`${preset.name}, ${preset.state}`);
    setIsOpen(false);
    onSelectLocation(preset.lat, preset.lng, `${preset.name}, ${preset.state}`);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let locName = `GPS Location (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`;
        try {
          const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=12`;
          const res = await fetch(revUrl, {
            headers: { 'User-Agent': 'TerraLynx-DisasterOps/2.0' },
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.state_district || addr.county || '';
            const st = addr.state || '';
            if (city) locName = st ? `${city}, ${st}` : city;
          }
        } catch (_) {}
        setQuery(locName);
        setIsLocating(false);
        setIsOpen(false);
        onSelectLocation(lat, lng, locName);
      },
      (err) => {
        setIsLocating(false);
        alert(`Could not detect current location: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div ref={dropdownRef} className="relative w-full max-w-lg z-30">
      {/* Search Input Box */}
      <div className="relative flex items-center bg-[#0d1322]/95 border border-[#263553] focus-within:border-cyan-400 rounded-xl shadow-2xl backdrop-blur-md transition-all">
        <div className="pl-3.5 pr-2 text-cyan-400">
          {isSearching || isLoading || isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search City, District or Taluk (e.g. Bhubaneswar, Cuttack)..."
          className="w-full py-2.5 pr-16 bg-transparent text-slate-100 placeholder-slate-400 text-xs font-mono focus:outline-none"
        />

        {/* GPS Current Location Quick Button */}
        <button
          onClick={handleDetectGPS}
          disabled={isLocating}
          title="Detect my current location via GPS"
          className="p-1.5 mr-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 rounded-lg transition-all"
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
        </button>

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="pr-3 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0b101c]/98 border border-[#263553] rounded-xl shadow-2xl overflow-hidden backdrop-blur-lg animate-in fade-in zoom-in-95 duration-100 text-xs font-mono">
          {/* Quick GPS Location Bar */}
          <button
            onClick={handleDetectGPS}
            disabled={isLocating}
            className="w-full px-3 py-2 bg-[#121c2e] hover:bg-cyan-950/90 text-cyan-300 border-b border-[#1b253b] text-left flex items-center space-x-2 transition-colors font-bold"
          >
            <Crosshair className={`w-3.5 h-3.5 text-cyan-400 ${isLocating ? 'animate-spin' : 'animate-pulse'}`} />
            <span>{isLocating ? 'Detecting GPS coordinates...' : '📍 Use My Exact Current Location'}</span>
          </button>

          {/* Quick Preset Chips */}
          <div className="p-2 border-b border-[#1b253b] bg-[#070b14]/90">
            <div className="text-[10px] text-slate-400 mb-1.5 px-1 flex items-center justify-between">
              <span>Quick Regional Presets:</span>
              <span className="text-cyan-400 flex items-center space-x-1">
                <Globe className="w-2.5 h-2.5" />
                <span>Global Coverage</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LOCATIONS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => handleSelectPreset(p)}
                  className="px-2 py-0.5 rounded-md bg-[#131b2d] hover:bg-cyan-950/80 hover:text-cyan-300 text-slate-300 border border-[#212c44] text-[11px] transition-colors flex items-center space-x-1"
                >
                  <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Results List */}
          {results.length > 0 ? (
            <div className="max-h-56 overflow-y-auto py-1 divide-y divide-[#151e30]">
              {results.map((item) => (
                <button
                  key={item.place_id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-3 py-2 text-left hover:bg-[#151f33] transition-colors flex items-start space-x-2.5 group"
                >
                  <Navigation className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform mt-0.5 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      {item.display_name.split(',')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {item.display_name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 && !isSearching ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              No matching locations found for "{query}".
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
