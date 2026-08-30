import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { GoogleWeatherCard, WeatherData } from './GoogleWeatherCard';
import { RefreshCw } from 'lucide-react';

interface PointInspectorPopupProps {
  coordinates: [number, number]; // [lng, lat]
  onClose: () => void;
  onSetSimulationFocus?: (lat: number, lng: number) => void;
}

export const PointInspectorPopup: React.FC<PointInspectorPopupProps> = ({
  coordinates,
  onClose,
  onSetSimulationFocus,
}) => {
  const [lng, lat] = coordinates;
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPoint = async () => {
    try {
      setLoading(true);
      const res = await apiService.fetchPointTelemetry(lat, lng);
      setData(res);
    } catch (e) {
      console.error('Failed to fetch point telemetry', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoint();
  }, [lat, lng]);

  if (loading && !data) {
    return (
      <div className="bg-[#1f2430]/95 border border-[#343e56] rounded-2xl p-6 shadow-2xl backdrop-blur-md text-xs w-[380px] text-slate-200 select-none flex flex-col items-center justify-center space-y-2">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="text-xs font-mono text-slate-300">Fetching live weather telemetry...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#1f2430]/95 border border-[#343e56] rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs w-80 text-slate-400 select-none text-center">
        Unable to sample live telemetry for this location.
      </div>
    );
  }

  return (
    <GoogleWeatherCard
      data={data}
      onClose={onClose}
      onSetSimulationFocus={onSetSimulationFocus}
      loading={loading}
      onRefresh={fetchPoint}
    />
  );
};
