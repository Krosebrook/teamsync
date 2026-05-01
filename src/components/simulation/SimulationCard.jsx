import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, CheckCircle2, Circle, Loader2, Flame } from 'lucide-react';
import { format } from 'date-fns';

const USE_CASE_LABELS = {
  pre_mortem: 'Pre-Mortem', roadmap: 'Roadmap', adr: 'Architecture',
  pmf_validation: 'PMF', tech_debt: 'Tech Debt', post_mortem: 'Post-Mortem',
  hiring: 'Hiring', build_buy: 'Build/Buy', migration: 'Migration',
  customer_escalation: 'Customer Escalation', custom: 'Custom',
};

const STATUS_CONFIG = {
  draft: { icon: Circle, color: 'text-slate-400', bg: 'bg-slate-100 text-slate-600' },
  running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50 text-blue-700', spin: true },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 text-emerald-700' },
};

function TensionsBadge({ tensions = [] }) {
  const critical = tensions.filter(t => t.severity === 'critical').length;
  const high = tensions.filter(t => t.severity === 'high').length;
  if (!tensions.length) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${critical > 0 ? 'text-red-600' : high > 0 ? 'text-orange-600' : 'text-slate-500'}`}>
      {critical > 0 && <Flame className="w-3 h-3" />}
      {!critical && <AlertTriangle className="w-3 h-3" />}
      {tensions.length} tension{tensions.length !== 1 ? 's' : ''}
      {critical > 0 && <span className="font-medium">— {critical} critical</span>}
      {!critical && high > 0 && <span>— {high} high</span>}
    </span>
  );
}

export default function SimulationCard({ simulation, onSelect, isSelected, compareMode }) {
  const cfg = STATUS_CONFIG[simulation.status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;

  return (
    <button
      onClick={() => onSelect(simulation)}
      aria-pressed={isSelected}
      aria-label={`${simulation.title} — ${simulation.status}`}
      className={`w-full text-left p-3 rounded-lg border cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
        isSelected
          ? 'border-slate-900 bg-slate-50'
          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
      } ${compareMode ? 'hover:bg-violet-50 hover:border-violet-300' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2 flex-1">{simulation.title}</p>
        <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${cfg.bg}`}>
          <Icon className={`w-2.5 h-2.5 ${cfg.color} ${cfg.spin ? 'animate-spin' : ''}`} />
          {simulation.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {simulation.use_case_type && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">
            {USE_CASE_LABELS[simulation.use_case_type] || simulation.use_case_type}
          </Badge>
        )}
        {simulation.selected_roles?.length > 0 && (
          <span className="text-xs text-slate-400 flex items-center gap-0.5">
            <Users className="w-2.5 h-2.5" />{simulation.selected_roles.length}
          </span>
        )}
        <TensionsBadge tensions={simulation.tensions} />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        {simulation.created_date && (
          <span className="text-xs text-slate-500">
            {format(new Date(simulation.created_date), 'MMM d')}
          </span>
        )}
        <span className="text-xs text-slate-600 font-medium" aria-hidden="true">
          View →
        </span>
      </div>
    </button>
  );
}