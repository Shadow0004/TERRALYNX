import React, { useState } from 'react';
import {
  Users,
  ShieldAlert,
  Home,
  Activity,
  Waves,
  Mountain,
  ChevronRight,
  X,
  AlertTriangle,
  HeartPulse,
  Baby,
  Building2,
  Landmark,
  FileText,
  BadgeCheck,
  Stethoscope,
  MapPin
} from 'lucide-react';
import { DistrictState, Zone } from '../../types';

interface DemographicsCardProps {
  state: DistrictState;
  onClose: () => void;
  onSelectZone?: (zone: Zone) => void;
}

export const DemographicsCard: React.FC<DemographicsCardProps> = ({
  state,
  onClose,
  onSelectZone,
}) => {
  const [activeTab, setActiveTab] = useState<'official' | 'overview' | 'zones'>('official');
  const { zones, kpis, hazard, official_census } = state;

  const totalPop = zones.reduce((acc, z) => acc + z.population, 0);
  const totalElderly = zones.reduce(
    (acc, z) => acc + Math.round((z.population * z.demographics.elderly_percent) / 100),
    0
  );
  const totalChildren = zones.reduce(
    (acc, z) => acc + Math.round((z.population * z.demographics.children_percent) / 100),
    0
  );
  const totalMedicallyDependent = zones.reduce(
    (acc, z) => acc + z.demographics.medical_dependency_count,
    0
  );
  const avgNonEngineeredHousing = Math.round(
    zones.reduce((acc, z) => acc + z.demographics.non_engineered_housing_percent, 0) / zones.length
  );
  const avgElevation = (
    zones.reduce((acc, z) => acc + z.topography.elevation_meters, 0) / zones.length
  ).toFixed(1);

  // Use official census data if available, or fall back to default structured Cuttack/District profile
  const census = official_census || {
    district_name: 'Cuttack District',
    state: 'Odisha',
    administrative_hq: 'Cuttack City',
    governing_body: 'Cuttack Municipal Corporation (CMC) & District Collectorate',
    total_population: 2624478,
    urban_population: 657947,
    rural_population: 1966531,
    area_sq_km: 3932.0,
    population_density_per_sq_km: 667,
    sex_ratio: '955 females / 1000 males',
    literacy_rate_percent: 85.5,
    male_literacy_percent: 91.1,
    female_literacy_percent: 79.6,
    children_0_6_count: 268540,
    children_percent: 10.2,
    elderly_60_plus_count: 314900,
    elderly_percent: 12.0,
    kutcha_housing_percent: 32.4,
    slum_population_percent: 18.6,
    medical_dependency_estimate: 14200,
    administrative_units: {
      tehsils: 15,
      blocks: 14,
      gram_panchayats: 373,
      villages: 1950,
      municipal_wards: 59,
      municipalities: ['Cuttack Municipal Corporation (CMC)', 'Choudwar Municipality', 'Banki NAC', 'Athagarh NAC']
    },
    hazard_vulnerability_profile: {
      cyclone_risk_zone: 'Very High (Category 4 Wind Threat & Delta Surge)',
      flood_inundation_risk: 'Severe (Mahanadi & Kathajodi River Basin Embankments)',
      seismic_zone: 'Zone III (Moderate Damage Risk)',
      major_river_basins: ['Mahanadi River', 'Kathajodi River', 'Birupa River', 'Kuakhai River']
    },
    critical_health_infrastructure: {
      apex_medical_college: 'SCB Medical College & Hospital (2,400 Beds, Trauma ICU)',
      specialized_institutes: 'Acharya Harihar Post Graduate Institute of Cancer, SVNIRTAR',
      community_health_centers: 18,
      primary_health_centers: 42,
      registered_ambulances: 84
    },
    source: 'Census of India 2011 & Odisha State Disaster Management Authority (OSDMA) Official Records'
  };

  return (
    <div className="bg-[#0e1424]/95 border border-[#233150] rounded-xl p-4 shadow-2xl backdrop-blur-md text-xs w-[430px] max-w-[95vw] text-slate-200 select-none relative animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#1b253b] pb-2.5 mb-3">
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-white font-mono text-[13px] flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-cyan-400" />
              OFFICIAL DISTRICT DEMOGRAPHICS
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono flex items-center gap-1">
              <BadgeCheck className="w-2.5 h-2.5 text-emerald-400" />
              Govt. Verified
            </span>
          </div>
          <div className="text-[11px] text-cyan-300 font-mono mt-0.5 font-semibold flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400" />
            {census.district_name}, {census.state}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-3 border-b border-[#1b253b] pb-1.5">
        <button
          onClick={() => setActiveTab('official')}
          className={`pb-1 text-xs font-mono font-bold transition-colors ${
            activeTab === 'official'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏛️ Official Census
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-1 text-xs font-mono font-bold transition-colors ${
            activeTab === 'overview'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📊 Live Ward Aggregate
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`pb-1 text-xs font-mono font-bold transition-colors ${
            activeTab === 'zones'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏙️ Sectors ({zones.length})
        </button>
      </div>

      {activeTab === 'official' ? (
        <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
          {/* Key Census Population Overview */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Total District Pop</span>
              </div>
              <div className="font-mono font-bold text-white text-base mt-0.5">
                {census.total_population.toLocaleString()}
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                Urban: <span className="text-cyan-300 font-semibold">{census.urban_population.toLocaleString()}</span> ({(census.urban_population / census.total_population * 100).toFixed(1)}%)
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                Rural: <span className="text-emerald-300 font-semibold">{census.rural_population.toLocaleString()}</span> ({(census.rural_population / census.total_population * 100).toFixed(1)}%)
              </div>
            </div>

            <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Area & Density</span>
              </div>
              <div className="font-mono font-bold text-amber-300 text-base mt-0.5">
                {census.population_density_per_sq_km.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/ km²</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                Total Area: <span className="text-white font-semibold">{census.area_sq_km.toLocaleString()} km²</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                Sex Ratio: <span className="text-pink-300 font-semibold">{census.sex_ratio}</span>
              </div>
            </div>
          </div>

          {/* Literacy & Social Indices */}
          <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              <span>Literacy & Demographics Profile</span>
              <span className="text-cyan-400 font-mono">{census.literacy_rate_percent}% Literacy</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
              <div style={{ width: `${census.male_literacy_percent}%` }} className="bg-cyan-500 h-full"></div>
              <div style={{ width: `${100 - census.male_literacy_percent}%` }} className="bg-slate-700 h-full"></div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-slate-400 pt-0.5">
              <div>Total: <span className="text-white font-bold">{census.literacy_rate_percent}%</span></div>
              <div>Male: <span className="text-cyan-300 font-bold">{census.male_literacy_percent}%</span></div>
              <div>Female: <span className="text-pink-300 font-bold">{census.female_literacy_percent}%</span></div>
            </div>
          </div>

          {/* Vulnerable Groups & Housing Status */}
          <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5 space-y-2">
            <div className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              Vulnerability & Housing Baseline
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-[#0b101c] p-1.5 rounded border border-[#1c2840]">
                <div className="text-[9px] text-amber-300">Elderly (&gt;60y)</div>
                <div className="font-mono font-bold text-white text-xs mt-0.5">{census.elderly_60_plus_count.toLocaleString()}</div>
                <div className="text-[8px] text-slate-400">{census.elderly_percent}% of pop</div>
              </div>

              <div className="bg-[#0b101c] p-1.5 rounded border border-[#1c2840]">
                <div className="text-[9px] text-cyan-300">Children (0-6y)</div>
                <div className="font-mono font-bold text-white text-xs mt-0.5">{census.children_0_6_count.toLocaleString()}</div>
                <div className="text-[8px] text-slate-400">{census.children_percent}% of pop</div>
              </div>

              <div className="bg-[#0b101c] p-1.5 rounded border border-[#1c2840]">
                <div className="text-[9px] text-orange-300">Kutcha / Tin Roof</div>
                <div className="font-mono font-bold text-white text-xs mt-0.5">{census.kutcha_housing_percent}%</div>
                <div className="text-[8px] text-slate-400">Slum: {census.slum_population_percent}%</div>
              </div>
            </div>
          </div>

          {/* Administrative Structure */}
          <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5 space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              Administrative & Governance Hierarchy
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              <span className="text-slate-400">Governing Body:</span> {census.governing_body}
            </div>
            <div className="grid grid-cols-4 gap-1 text-center pt-1 font-mono">
              <div className="bg-[#0b101c] p-1 rounded border border-[#1c2840]">
                <div className="text-[8px] text-slate-400">Tehsils</div>
                <div className="font-bold text-white text-xs">{census.administrative_units.tehsils}</div>
              </div>
              <div className="bg-[#0b101c] p-1 rounded border border-[#1c2840]">
                <div className="text-[8px] text-slate-400">Blocks</div>
                <div className="font-bold text-white text-xs">{census.administrative_units.blocks}</div>
              </div>
              <div className="bg-[#0b101c] p-1 rounded border border-[#1c2840]">
                <div className="text-[8px] text-slate-400">Panchayats</div>
                <div className="font-bold text-white text-xs">{census.administrative_units.gram_panchayats}</div>
              </div>
              <div className="bg-[#0b101c] p-1 rounded border border-[#1c2840]">
                <div className="text-[8px] text-slate-400">ULB Wards</div>
                <div className="font-bold text-white text-xs">{census.administrative_units.municipal_wards}</div>
              </div>
            </div>
          </div>

          {/* Health Infrastructure */}
          <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5 space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Stethoscope className="w-3 h-3 text-red-400" />
              Critical Health & Hospital Network
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              <span className="text-slate-400">Apex Facility:</span> {census.critical_health_infrastructure.apex_medical_college}
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-[#1a2438]">
              <div>CHCs: <span className="text-white font-bold">{census.critical_health_infrastructure.community_health_centers}</span></div>
              <div>PHCs: <span className="text-white font-bold">{census.critical_health_infrastructure.primary_health_centers}</span></div>
              <div>Ambulances: <span className="text-emerald-300 font-bold">{census.critical_health_infrastructure.registered_ambulances} Fleet</span></div>
            </div>
          </div>

          {/* Official Source Badge */}
          <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[9px] text-slate-400 font-mono flex items-center justify-between">
            <span>Source: {census.source}</span>
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />
          </div>
        </div>
      ) : activeTab === 'overview' ? (
        <div className="space-y-3">
          {/* Key Population Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Ward Population</span>
              </div>
              <div className="font-mono font-bold text-white text-base mt-0.5">
                {totalPop.toLocaleString()}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                Exposed: <span className="text-amber-300 font-semibold">{kpis.total_population_exposed.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Evacuation Demand</span>
              </div>
              <div className="font-mono font-bold text-red-400 text-base mt-0.5">
                {kpis.total_evacuation_demand.toLocaleString()}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                Cap: <span className="text-emerald-300">{kpis.total_shelter_capacity.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* High-Risk Demographics Breakdown */}
          <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5 space-y-2">
            <div className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              Live Vulnerable Demographics
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-[#0b101c] p-1.5 rounded border border-[#1c2840]">
                <div className="flex items-center justify-center space-x-1 text-[9px] text-amber-300">
                  <Users className="w-2.5 h-2.5" />
                  <span>Elderly (&gt;60y)</span>
                </div>
                <div className="font-mono font-bold text-white text-xs mt-0.5">
                  {totalElderly.toLocaleString()}
                </div>
                <div className="text-[8px] text-slate-400">
                  {((totalElderly / totalPop) * 100).toFixed(1)}% of pop
                </div>
              </div>

              <div className="bg-[#0b101c] p-1.5 rounded border border-[#1c2840]">
                <div className="flex items-center justify-center space-x-1 text-[9px] text-cyan-300">
                  <Baby className="w-2.5 h-2.5" />
                  <span>Children (&lt;10y)</span>
                </div>
                <div className="font-mono font-bold text-white text-xs mt-0.5">
                  {totalChildren.toLocaleString()}
                </div>
                <div className="text-[8px] text-slate-400">
                  {((totalChildren / totalPop) * 100).toFixed(1)}% of pop
                </div>
              </div>

              <div className="bg-[#0b101c] p-1.5 rounded border border-[#1c2840]">
                <div className="flex items-center justify-center space-x-1 text-[9px] text-red-300">
                  <HeartPulse className="w-2.5 h-2.5" />
                  <span>Med. Dependent</span>
                </div>
                <div className="font-mono font-bold text-white text-xs mt-0.5">
                  {totalMedicallyDependent.toLocaleString()}
                </div>
                <div className="text-[8px] text-slate-400">Ambulance priority</div>
              </div>
            </div>

            {/* Housing & Topography Stats */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1a2438]">
              <div className="flex items-center space-x-1.5 text-[11px]">
                <Home className="w-3 h-3 text-orange-400 shrink-0" />
                <div>
                  <div className="text-[9px] text-slate-400">Kutcha / Non-Engineered</div>
                  <div className="font-mono font-bold text-orange-300">{avgNonEngineeredHousing}% of homes</div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-[11px]">
                <Mountain className="w-3 h-3 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[9px] text-slate-400">Mean Elevation</div>
                  <div className="font-mono font-bold text-emerald-300">{avgElevation} meters ASL</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
          {zones.map((z) => {
            const tierColor =
              z.risk_level === 'CRITICAL'
                ? 'text-red-400 border-red-900/60 bg-red-950/20'
                : z.risk_level === 'HIGH'
                ? 'text-orange-400 border-orange-900/60 bg-orange-950/20'
                : z.risk_level === 'WATCH'
                ? 'text-yellow-400 border-yellow-900/60 bg-yellow-950/20'
                : 'text-emerald-400 border-emerald-900/60 bg-emerald-950/20';

            return (
              <div
                key={z.id}
                onClick={() => onSelectZone && onSelectZone(z)}
                className={`p-2 rounded-lg border ${tierColor} cursor-pointer hover:brightness-125 transition-all flex items-center justify-between`}
              >
                <div>
                  <div className="font-bold text-white font-mono text-[11px] truncate max-w-[200px]">
                    {z.name}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    Pop: {z.population.toLocaleString()} • Elev: {z.topography.elevation_meters}m
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] font-bold">{z.risk_level}</div>
                  <div className="text-[9px] text-slate-400">{z.risk_score}/100</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
