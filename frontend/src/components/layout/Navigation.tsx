import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Home, 
  Navigation as RouteIcon, 
  Truck, 
  Sliders, 
  Bot,
  AlertCircle
} from 'lucide-react';
import { AlertTier } from '../../types';

export type NavTab = 
  | 'command_center' 
  | 'risk_map' 
  | 'shelters_evac' 
  | 'routing' 
  | 'resources' 
  | 'simulator' 
  | 'ai_assistant';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  criticalAlertsCount: number;
  resourceShortfallsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  criticalAlertsCount,
  resourceShortfallsCount,
}) => {
  const tabs = [
    {
      id: 'command_center' as NavTab,
      label: 'Command Center',
      icon: LayoutDashboard,
      badge: criticalAlertsCount > 0 ? `${criticalAlertsCount}` : null,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'risk_map' as NavTab,
      label: 'Interactive Risk Map',
      icon: MapIcon,
      badge: '10 Zones',
      badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-800',
    },
    {
      id: 'shelters_evac' as NavTab,
      label: 'Shelter Optimization',
      icon: Home,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'routing' as NavTab,
      label: 'Evacuation Corridors',
      icon: RouteIcon,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'resources' as NavTab,
      label: 'Resource Logistics',
      icon: Truck,
      badge: resourceShortfallsCount > 0 ? `${resourceShortfallsCount} Deficit` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      id: 'simulator' as NavTab,
      label: 'What-If Simulator',
      icon: Sliders,
      badge: 'Interactive',
      badgeColor: 'bg-indigo-950 text-indigo-300 border border-indigo-700/60',
    },
    {
      id: 'ai_assistant' as NavTab,
      label: 'Decision AI',
      icon: Bot,
      badge: 'Live State',
      badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
    },
  ];

  return (
    <nav className="bg-[#0b0f19] border-b border-[#1b2334] px-4 py-1.5 flex items-center space-x-1 overflow-x-auto select-none no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              isActive
                ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-700/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141b2b] border border-transparent'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${tab.badgeColor}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
