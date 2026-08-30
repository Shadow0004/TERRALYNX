import React, { useState } from 'react';
import {
  MapPin,
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
  ArrowUp,
  X,
  RefreshCw,
  Radio,
  ChevronRight
} from 'lucide-react';

export interface HourlyForecastItem {
  time: string;
  iso_time: string;
  temperature_c: number;
  precipitation_probability: number;
  precipitation_mm: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  wind_direction_cardinal: string;
  weather_code: number;
  weather_description: string;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  location_name?: string;
  temperature_c: number;
  humidity_percent: number;
  precipitation_probability?: number;
  rainfall_rate_mm_hr: number;
  rain_24h_sum_mm: number;
  wind_speed_kmh: number;
  wind_gusts_kmh: number;
  wind_direction_deg: number;
  wind_direction_cardinal: string;
  surface_pressure_hpa: number;
  elevation_meters: number;
  weather_description: string;
  soil_saturation_percent: number;
  point_risk_score?: number;
  risk_tier?: string;
  hourly_forecast?: HourlyForecastItem[];
  updated_at: string;
}

interface GoogleWeatherCardProps {
  data: WeatherData;
  onClose: () => void;
  onSetSimulationFocus?: (lat: number, lng: number) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

export const GoogleWeatherCard: React.FC<GoogleWeatherCardProps> = ({
  data,
  onClose,
  onSetSimulationFocus,
  loading = false,
  onRefresh,
}) => {
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [activeTab, setActiveTab] = useState<'temperature' | 'precipitation' | 'wind'>('temperature');

  const toF = (c: number) => Math.round((c * 9) / 5 + 32);
  const displayTemp = (c: number) => (unit === 'C' ? Math.round(c) : toF(c));

  // Render authentic Google weather condition icon
  const renderWeatherIcon = (code: number, size: 'large' | 'small' = 'large') => {
    const isSmall = size === 'small';
    const iconSize = isSmall ? 'w-5 h-5' : 'w-14 h-14';

    // Thunderstorm
    if (code >= 95) {
      return (
        <div className={`relative flex items-center justify-center ${isSmall ? 'w-6 h-6' : 'w-16 h-16'}`}>
          <CloudLightning className={`${iconSize} text-amber-400 fill-amber-400/20`} />
        </div>
      );
    }
    // Rain / Drizzle / Showers
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return (
        <div className={`relative flex items-center justify-center ${isSmall ? 'w-6 h-6' : 'w-16 h-16'}`}>
          <div className="relative">
            <Cloud className={`${iconSize} text-slate-300 fill-slate-700/60`} />
            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 flex space-x-0.5 text-blue-400`}>
              <Droplets className={`${isSmall ? 'w-3 h-3' : 'w-6 h-6'} animate-bounce text-blue-400 fill-blue-500`} />
            </div>
          </div>
        </div>
      );
    }
    // Fog
    if (code === 45 || code === 48) {
      return <CloudFog className={`${iconSize} text-slate-400`} />;
    }
    // Cloudy
    if (code === 2 || code === 3) {
      return <Cloud className={`${iconSize} text-slate-300 fill-slate-600/40`} />;
    }
    // Clear
    return <Sun className={`${iconSize} text-amber-400 fill-amber-400 animate-spin-slow`} />;
  };

  const precipProb = data.precipitation_probability ?? Math.min(100, Math.round(data.rainfall_rate_mm_hr * 15 + 30));
  const hourly = data.hourly_forecast && data.hourly_forecast.length > 0 ? data.hourly_forecast : [];

  return (
    <div className="bg-[#1f2430]/95 border border-[#343e56] rounded-2xl p-4 shadow-2xl backdrop-blur-md text-slate-200 select-none relative w-[420px] max-w-[95vw] animate-in fade-in zoom-in-95 duration-150 font-sans">
      {/* Top Location Header */}
      <div className="flex items-start justify-between border-b border-[#2d364c] pb-2.5 mb-3">
        <div className="flex items-center space-x-1.5 overflow-hidden">
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium text-white text-[13px] truncate font-sans" title={data.location_name}>
            {data.location_name || `Lat: ${data.latitude.toFixed(3)}°, Lng: ${data.longitude.toFixed(3)}°`}
          </span>
        </div>
        <div className="flex items-center space-x-1 shrink-0 ml-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Refresh weather"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Weather Section (Matching Screenshot) */}
      <div className="flex items-center justify-between px-1 py-1 mb-3">
        {/* Left: Weather Icon */}
        <div className="flex items-center space-x-3">
          {renderWeatherIcon(data.hourly_forecast?.[0]?.weather_code || 61, 'large')}

          {/* Big Temperature with °C | °F Switch */}
          <div className="flex items-start">
            <span className="text-5xl font-light text-white tracking-tighter leading-none font-sans">
              {displayTemp(data.temperature_c)}
            </span>
            <div className="text-sm ml-1.5 flex items-center space-x-1 text-slate-400 pt-0.5 font-sans">
              <button
                onClick={() => setUnit('C')}
                className={`font-semibold transition-colors ${unit === 'C' ? 'text-white' : 'hover:text-slate-200'}`}
              >
                °C
              </button>
              <span>|</span>
              <button
                onClick={() => setUnit('F')}
                className={`font-semibold transition-colors ${unit === 'F' ? 'text-white' : 'hover:text-slate-200'}`}
              >
                °F
              </button>
            </div>
          </div>
        </div>

        {/* Right: Precipitation, Humidity, Wind */}
        <div className="text-right text-[12px] space-y-0.5 text-slate-300 font-sans">
          <div>
            Precipitation: <span className="text-white font-medium">{precipProb}%</span>
          </div>
          <div>
            Humidity: <span className="text-white font-medium">{Math.round(data.humidity_percent)}%</span>
          </div>
          <div>
            Wind: <span className="text-white font-medium">{Math.round(data.wind_speed_kmh)} km/h</span>
          </div>
        </div>
      </div>

      {/* Interactive Tab Switcher (Temperature | Precipitation | Wind) */}
      <div className="flex border-b border-[#2d364c] mb-3 text-xs font-medium">
        <button
          onClick={() => setActiveTab('temperature')}
          className={`pb-2 px-3 transition-colors relative ${
            activeTab === 'temperature' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Temperature
          {activeTab === 'temperature' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-400 rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('precipitation')}
          className={`pb-2 px-3 transition-colors relative ${
            activeTab === 'precipitation' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Precipitation
          {activeTab === 'precipitation' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-400 rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('wind')}
          className={`pb-2 px-3 transition-colors relative ${
            activeTab === 'wind' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Wind
          {activeTab === 'wind' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-400 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Hourly Forecast Carousel / Timeline */}
      <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex space-x-3 min-w-max py-1 px-1">
          {hourly.slice(0, 12).map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-between text-center min-w-[52px] bg-[#171b26]/70 border border-[#2b344a] rounded-xl p-2 space-y-1.5 hover:border-cyan-500/50 transition-all"
            >
              {/* Time */}
              <div className="text-[11px] text-slate-400 font-medium">{item.time}</div>

              {/* Dynamic Value Based on Active Tab */}
              {activeTab === 'temperature' && (
                <>
                  <div className="my-0.5">{renderWeatherIcon(item.weather_code, 'small')}</div>
                  <div className="font-bold text-white text-[13px] font-sans">
                    {displayTemp(item.temperature_c)}°
                  </div>
                </>
              )}

              {activeTab === 'precipitation' && (
                <>
                  <div className="text-blue-400 font-bold text-[12px] font-sans">
                    {item.precipitation_probability}%
                  </div>
                  <div className="w-6 bg-slate-800 h-8 rounded-full flex flex-col justify-end overflow-hidden">
                    <div
                      style={{ height: `${Math.max(10, item.precipitation_probability)}%` }}
                      className="bg-blue-500 rounded-full w-full transition-all"
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-400">{item.precipitation_mm}mm</div>
                </>
              )}

              {activeTab === 'wind' && (
                <>
                  <div
                    className="w-5 h-5 rounded-full bg-slate-800/90 flex items-center justify-center text-cyan-400 my-0.5"
                    style={{ transform: `rotate(${item.wind_direction_deg}deg)` }}
                    title={`${item.wind_direction_deg}° (${item.wind_direction_cardinal})`}
                  >
                    <ArrowUp className="w-3 h-3" />
                  </div>
                  <div className="font-bold text-white text-[11px] font-sans">
                    {Math.round(item.wind_speed_kmh)}
                    <span className="text-[9px] font-normal text-slate-400 block">km/h</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Point Evacuation / Simulation Trigger Button */}
      {onSetSimulationFocus && (
        <button
          onClick={() => onSetSimulationFocus(data.latitude, data.longitude)}
          className="mt-3 w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-lg active:scale-95"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Center Simulation & Evacuation Grid Here</span>
        </button>
      )}
    </div>
  );
};
