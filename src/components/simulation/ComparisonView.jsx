import React, { useState, useMemo } from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle, Users, FileText, X, BarChart3,
  ArrowRight, CheckCircle2, TrendingUp, Zap, GitCompare, Info
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const SIM_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];
const SEVERITY_ORDER = { low: 1, medium: 2, high: 3, critical: 4 };
const SEVERITY_COLORS = {
  critical: 'bg-rose-100 text-rose-700 border-rose-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'roles', label: 'Role Perspectives', icon: Users },
  { id: 'tensions', label: 'Tensions', icon: AlertCircle },
  { id: 'outcomes', label: 'Outcomes & Actions', icon: ArrowRight },
];

function MetricBadge({ value, color }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: color + '22', color }}>
      {value}
    </span>
  );
}

function SimulationColumn({ sim, color, onRemove }) {
  return (
    <Card className="p-4 border-t-4" style={{ borderTopColor: color }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <h3 className="font-semibold text-slate-800 text-sm truncate">{sim.title}</h3>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2">{sim.scenario}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="text-[10px]">{sim.responses?.length || 0} roles</Badge>
            <Badge variant="outline" className="text-[10px]">{sim.tensions?.length || 0} tensions</Badge>
            {sim.created_date && (
              <Badge variant="outline" className="text-[10px] text-slate-400">
                {format(new Date(sim.created_date), 'MMM d, yyyy')}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => onRemove(sim.id)}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
}

function OverviewTab({ simulations }) {
  // Build radar chart data: one axis per unique role, value = influence
  const allRoles = useMemo(() => {
    const roles = new Set();
    simulations.forEach(sim => sim.selected_roles?.forEach(r => roles.add(r.role)));
    return Array.from(roles).slice(0, 8); // cap for readability
  }, [simulations]);

  const radarData = allRoles.map(role => {
    const entry = { role: role.replace(/_/g, ' ') };
    simulations.forEach((sim, i) => {
      const r = sim.selected_roles?.find(sr => sr.role === role);
      entry[`sim${i}`] = r?.influence ?? 0;
    });
    return entry;
  });

  // Tension severity breakdown per sim
  const tensionData = ['low', 'medium', 'high', 'critical'].map(sev => {
    const entry = { severity: sev };
    simulations.forEach((sim, i) => {
      entry[`sim${i}`] = sim.tensions?.filter(t => t.severity === sev).length ?? 0;
    });
    return entry;
  });

  const stats = simulations.map((sim, i) => ({
    color: SIM_COLORS[i],
    roles: sim.selected_roles?.length ?? 0,
    tensions: sim.tensions?.length ?? 0,
    criticalTensions: sim.tensions?.filter(t => t.severity === 'critical').length ?? 0,
    nextSteps: sim.next_steps?.length ?? 0,
    completedSteps: sim.next_steps?.filter(s => s.completed).length ?? 0,
    highRiskRoles: sim.responses?.filter(r => r.risk_tolerance === 'high').length ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Metrics at a Glance</h4>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${simulations.length}, 1fr)` }}>
          {stats.map((s, i) => (
            <div key={i} className="space-y-2">
              {[
                { label: 'Roles', value: s.roles },
                { label: 'Tensions', value: s.tensions },
                { label: 'Critical', value: s.criticalTensions },
                { label: 'Actions', value: `${s.completedSteps}/${s.nextSteps}` },
                { label: 'High Risk', value: s.highRiskRoles },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-500">{label}</span>
                  <MetricBadge value={value} color={s.color} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tension Bar Chart Overlay */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tension Severity Overlay</h4>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tensionData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="severity" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              {simulations.map((sim, i) => (
                <Bar key={i} dataKey={`sim${i}`} name={sim.title?.slice(0, 20)} fill={SIM_COLORS[i]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Role Influence Radar */}
      {radarData.length > 2 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Role Influence Radar</h4>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="role" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                {simulations.map((sim, i) => (
                  <Radar key={i} name={sim.title?.slice(0, 20)} dataKey={`sim${i}`} stroke={SIM_COLORS[i]} fill={SIM_COLORS[i]} fillOpacity={0.15} />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function RolesTab({ simulations }) {
  const allRoles = useMemo(() => {
    const roles = new Set();
    simulations.forEach(sim => sim.responses?.forEach(r => roles.add(r.role)));
    return Array.from(roles);
  }, [simulations]);

  return (
    <div className="space-y-3">
      {allRoles.map(roleId => {
        const perspectives = simulations.map(sim => sim.responses?.find(r => r.role === roleId));
        if (perspectives.every(p => !p)) return null;

        return (
          <motion.div key={roleId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <h4 className="font-semibold text-slate-800 text-sm capitalize">
                {roleId.replace(/_/g, ' ').replace('custom ', '')}
              </h4>
            </div>
            <div className="grid divide-x divide-slate-200" style={{ gridTemplateColumns: `repeat(${simulations.length}, 1fr)` }}>
              {perspectives.map((p, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: SIM_COLORS[i] }} />
                    <span className="text-[10px] font-medium text-slate-500 truncate">{simulations[i].title}</span>
                  </div>
                  {p ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-700 leading-relaxed">{p.position}</p>
                      {p.primary_driver && (
                        <p className="text-[10px] text-violet-600 italic">↳ {p.primary_driver}</p>
                      )}
                      <div className="flex flex-wrap gap-1 pt-1">
                        <Badge variant="outline" className={`text-[10px] ${
                          p.risk_tolerance === 'high' ? 'bg-rose-50 text-rose-700' :
                          p.risk_tolerance === 'medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {p.risk_tolerance} risk
                        </Badge>
                      </div>
                      {p.concerns?.length > 0 && (
                        <ul className="space-y-0.5 pt-1">
                          {p.concerns.slice(0, 2).map((c, ci) => (
                            <li key={ci} className="text-[10px] text-slate-500 flex gap-1">
                              <span className="text-slate-300 flex-shrink-0">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Role not included</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function TensionsTab({ simulations }) {
  const allTensionPairs = useMemo(() => {
    const map = new Map();
    simulations.forEach((sim, simIdx) => {
      sim.tensions?.forEach(t => {
        const key = [...t.between].sort().join('|||');
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({ simIdx, tension: t });
      });
    });
    // Sort by max severity
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      const maxA = Math.max(...a.map(o => SEVERITY_ORDER[o.tension.severity] ?? 0));
      const maxB = Math.max(...b.map(o => SEVERITY_ORDER[o.tension.severity] ?? 0));
      return maxB - maxA;
    });
  }, [simulations]);

  if (allTensionPairs.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No tensions to compare</p>;
  }

  return (
    <div className="space-y-3">
      {allTensionPairs.map(([pairKey, occurrences]) => {
        const roles = pairKey.split('|||');
        const presentCount = new Set(occurrences.map(o => o.simIdx)).size;

        return (
          <motion.div key={pairKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-800 capitalize">
                {roles[0]?.replace(/_/g, ' ')}
                <span className="text-slate-400 font-normal mx-1.5">vs</span>
                {roles[1]?.replace(/_/g, ' ')}
              </span>
              <Badge variant="outline" className={`ml-auto text-[10px] ${presentCount === simulations.length ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
                {presentCount}/{simulations.length} sims
              </Badge>
            </div>
            <div className="grid divide-x divide-slate-200" style={{ gridTemplateColumns: `repeat(${simulations.length}, 1fr)` }}>
              {simulations.map((sim, simIdx) => {
                const occ = occurrences.find(o => o.simIdx === simIdx);
                return (
                  <div key={simIdx} className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: SIM_COLORS[simIdx] }} />
                      <span className="text-[10px] font-medium text-slate-500 truncate">{sim.title}</span>
                    </div>
                    {occ ? (
                      <div className="space-y-2">
                        <Badge className={`text-[10px] border ${SEVERITY_COLORS[occ.tension.severity]}`}>
                          {occ.tension.severity}
                        </Badge>
                        <p className="text-xs text-slate-700 leading-relaxed">{occ.tension.description}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <p className="text-xs text-slate-400 italic">No tension detected</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function OutcomesTab({ simulations }) {
  return (
    <div className="space-y-6">
      {/* Summaries */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Executive Summaries</h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${simulations.length}, 1fr)` }}>
          {simulations.map((sim, i) => (
            <Card key={sim.id} className="p-4 border-l-4" style={{ borderLeftColor: SIM_COLORS[i] }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: SIM_COLORS[i] }} />
                <span className="text-[10px] font-semibold text-slate-600 truncate">{sim.title}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed line-clamp-6">
                {sim.summary || <span className="text-slate-400 italic">No summary available</span>}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Next Steps Overlay */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recommended Actions</h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${simulations.length}, 1fr)` }}>
          {simulations.map((sim, i) => (
            <div key={sim.id} className="space-y-2">
              {(sim.next_steps || []).slice(0, 5).map((step, si) => (
                <div key={si} className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${step.completed ? 'bg-slate-50 opacity-60' : 'bg-white'}`}>
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${step.completed ? 'bg-emerald-500' : 'border-2'}`} style={{ borderColor: step.completed ? undefined : SIM_COLORS[i] }}>
                    {step.completed && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`leading-relaxed ${step.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {step.action}
                    </p>
                    {step.owner_role && (
                      <span className="text-[10px] text-slate-400 capitalize">{step.owner_role.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${
                    step.priority === 'high' ? 'bg-rose-50 text-rose-600' :
                    step.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {step.priority}
                  </Badge>
                </div>
              ))}
              {(!sim.next_steps || sim.next_steps.length === 0) && (
                <p className="text-xs text-slate-400 italic">No actions recorded</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trade-offs Comparison */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Decision Trade-offs</h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${simulations.length}, 1fr)` }}>
          {simulations.map((sim, i) => (
            <div key={sim.id} className="space-y-2">
              {(sim.decision_trade_offs || []).slice(0, 4).map((tradeoff, ti) => (
                <div key={ti} className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                  <p className="font-semibold text-slate-700">{tradeoff.trade_off}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-violet-50 rounded p-1.5">
                      <p className="text-[10px] text-violet-500 font-medium mb-0.5">Option A</p>
                      <p className="text-violet-800 leading-snug">{tradeoff.option_a}</p>
                    </div>
                    <div className="bg-amber-50 rounded p-1.5">
                      <p className="text-[10px] text-amber-500 font-medium mb-0.5">Option B</p>
                      <p className="text-amber-800 leading-snug">{tradeoff.option_b}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!sim.decision_trade_offs || sim.decision_trade_offs.length === 0) && (
                <p className="text-xs text-slate-400 italic">No trade-offs recorded</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ComparisonView({ simulations, onRemove }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!simulations || simulations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <GitCompare className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">No simulations selected</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          Enable Compare mode and select 2–4 simulations from the history panel
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-violet-600" />
            Comparing {simulations.length} Simulations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Metrics, tensions, and outcomes overlaid side-by-side
          </p>
        </div>
      </div>

      {/* Simulation Header Cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${simulations.length}, 1fr)` }}>
        {simulations.map((sim, i) => (
          <SimulationColumn key={sim.id} sim={sim} color={SIM_COLORS[i]} onRemove={onRemove} />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab simulations={simulations} />}
        {activeTab === 'roles' && <RolesTab simulations={simulations} />}
        {activeTab === 'tensions' && <TensionsTab simulations={simulations} />}
        {activeTab === 'outcomes' && <OutcomesTab simulations={simulations} />}
      </div>
    </div>
  );
}