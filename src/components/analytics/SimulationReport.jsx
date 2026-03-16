import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Target, ChevronRight } from 'lucide-react';
import InfluenceDistribution from './InfluenceDistribution';
import ConsensusTrends from './ConsensusTrends';
import RoleImpactReport from './RoleImpactReport';

const SECTIONS = [
  {
    id: 'influence',
    label: 'Influence Distribution',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBg: 'bg-blue-600',
    description: 'How influence is allocated across roles — averages, shares, and tier breakdown.',
  },
  {
    id: 'consensus',
    label: 'Consensus Trends',
    icon: TrendingUp,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    activeBg: 'bg-violet-600',
    description: 'Team alignment score over time, derived from confidence, tensions, and risk tolerance agreement.',
  },
  {
    id: 'impact',
    label: 'Role Impact Report',
    icon: Target,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    activeBg: 'bg-emerald-600',
    description: 'How each role shaped final outcomes — influence share, action ownership, tension involvement, and composite impact score.',
  },
];

export default function SimulationReport({ simulations }) {
  const [activeSection, setActiveSection] = useState('influence');

  const section = SECTIONS.find(s => s.id === activeSection);
  const Icon = section.icon;

  return (
    <div className="space-y-6">
      {/* Section nav */}
      <div className="grid grid-cols-3 gap-3">
        {SECTIONS.map(s => {
          const SIcon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                isActive
                  ? `${s.bg} ${s.border} shadow-sm`
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${isActive ? s.bg : 'bg-slate-100'}`}>
                  <SIcon className={`w-4 h-4 ${isActive ? s.color : 'text-slate-500'}`} />
                </div>
                {isActive && <ChevronRight className={`w-3.5 h-3.5 ${s.color}`} />}
              </div>
              <p className={`text-sm font-semibold mb-0.5 ${isActive ? s.color : 'text-slate-700'}`}>
                {s.label}
              </p>
              <p className="text-xs text-slate-400 line-clamp-2 hidden sm:block">{s.description}</p>
            </button>
          );
        })}
      </div>

      {/* Section header */}
      <div className={`flex items-start gap-4 p-5 rounded-xl border ${section.bg} ${section.border}`}>
        <div className={`p-2.5 rounded-xl ${section.bg} border ${section.border} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${section.color}`} />
        </div>
        <div>
          <h2 className={`text-base font-semibold ${section.color}`}>{section.label}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{section.description}</p>
        </div>
        <Badge variant="outline" className="ml-auto flex-shrink-0 text-xs">
          {simulations.length} simulation{simulations.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Section content */}
      {activeSection === 'influence' && <InfluenceDistribution simulations={simulations} />}
      {activeSection === 'consensus' && <ConsensusTrends simulations={simulations} />}
      {activeSection === 'impact' && <RoleImpactReport simulations={simulations} />}
    </div>
  );
}