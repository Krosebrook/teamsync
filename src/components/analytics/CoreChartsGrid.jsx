import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Cell } from 'recharts';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie
} from 'recharts';
import { TrendingUp, Users, Flame, AlertTriangle, Target, Activity, CheckCircle2, Clock, Zap } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const ROLE_COLORS = [
  '#8b5cf6','#3b82f6','#06b6d4','#f43f5e','#f59e0b',
  '#10b981','#ec4899','#6366f1','#84cc16','#f97316',
];

const TENSION_COLORS = { critical:'#f43f5e', high:'#f97316', medium:'#f59e0b', low:'#10b981' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-800">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function CoreChartsGrid({ simulations, outcomes }) {
  const simsOverTime = useMemo(() => {
    const byDate = {};
    simulations.forEach(s => {
      if (!s.created_date) return;
      const d = format(parseISO(s.created_date), 'MMM d');
      byDate[d] = (byDate[d] || 0) + 1;
    });
    return Object.entries(byDate).map(([date, count]) => ({ date, count })).slice(-20);
  }, [simulations]);

  const roleInfluenceData = useMemo(() => {
    const roleMap = {};
    simulations.forEach(s => {
      s.selected_roles?.forEach(r => {
        if (!roleMap[r.role]) roleMap[r.role] = { role: r.role, totalInfluence: 0, count: 0, appearances: 0 };
        roleMap[r.role].totalInfluence += r.influence || 5;
        roleMap[r.role].count++;
        roleMap[r.role].appearances++;
      });
    });
    return Object.values(roleMap)
      .map(r => ({ ...r, avgInfluence: parseFloat((r.totalInfluence / r.count).toFixed(1)), role: r.role.replace(/_/g, ' ') }))
      .sort((a, b) => b.appearances - a.appearances)
      .slice(0, 12);
  }, [simulations]);

  const tensionSeverityData = useMemo(() => {
    const severity = { critical: 0, high: 0, medium: 0, low: 0 };
    simulations.forEach(s => s.tensions?.forEach(t => { if (severity[t.severity] !== undefined) severity[t.severity]++; }));
    return Object.entries(severity).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [simulations]);

  const tensionTrendData = useMemo(() => {
    return simulations.slice().reverse().map((s, i) => ({
      sim: i + 1,
      tensions: s.tensions?.length || 0,
      critical: s.tensions?.filter(t => t.severity === 'critical').length || 0,
      roles: s.selected_roles?.length || 0,
      avgConfidence: s.next_steps?.length
        ? Math.round(s.next_steps.reduce((a, ns) => a + (ns.confidence || 0), 0) / s.next_steps.length) : 0,
      completedSteps: s.next_steps?.filter(ns => ns.completed).length || 0,
      totalSteps: s.next_steps?.length || 0,
    }));
  }, [simulations]);

  const useCaseData = useMemo(() => {
    const counts = {};
    simulations.forEach(s => { const k = s.use_case_type || 'custom'; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })).sort((a, b) => b.value - a.value);
  }, [simulations]);

  const radarData = useMemo(() => {
    return roleInfluenceData.slice(0, 8).map(r => ({
      role: r.role.length > 12 ? r.role.slice(0, 12) + '…' : r.role,
      avgInfluence: r.avgInfluence,
      appearances: r.appearances,
    }));
  }, [roleInfluenceData]);

  const outcomeData = useMemo(() => {
    if (!outcomes.length) return null;
    const counts = { success: 0, partial_success: 0, failure: 0, abandoned: 0, ongoing: 0 };
    outcomes.forEach(o => { if (counts[o.actual_outcome] !== undefined) counts[o.actual_outcome]++; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  }, [outcomes]);

  const completionRateData = useMemo(() => {
    return tensionTrendData.filter(d => d.totalSteps > 0).map(d => ({
      ...d,
      completionRate: Math.round((d.completedSteps / d.totalSteps) * 100),
    }));
  }, [tensionTrendData]);

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" /> Simulations Over Time
          </h3>
          <p className="text-xs text-slate-400 mb-4">Completed simulations by date</p>
          {simsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={simsOverTime} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Simulations" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Not enough data</div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Decision Types
          </h3>
          <p className="text-xs text-slate-400 mb-4">By use case category</p>
          {useCaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={useCaseData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {useCaseData.map((_, i) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>
          )}
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" /> Role Influence Patterns
          </h3>
          <p className="text-xs text-slate-400 mb-4">Average influence weight by role</p>
          {roleInfluenceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roleInfluenceData} layout="vertical" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="role" type="category" tick={{ fontSize: 9 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgInfluence" name="Avg Influence" radius={[0, 3, 3, 0]}>
                  {roleInfluenceData.map((_, i) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No role data</div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" /> Tension Severity Breakdown
          </h3>
          <p className="text-xs text-slate-400 mb-4">Distribution of conflict severity</p>
          {tensionSeverityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={tensionSeverityData} cx="50%" cy="50%" outerRadius={95} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {tensionSeverityData.map(entry => <Cell key={entry.name} fill={TENSION_COLORS[entry.name] || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No tension data</div>
          )}
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" /> Tensions Per Simulation
          </h3>
          <p className="text-xs text-slate-400 mb-4">Total vs critical tensions over time</p>
          {tensionTrendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={tensionTrendData}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="sim" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="tensions" name="Total" stroke="#f59e0b" fill="url(#totalGrad)" strokeWidth={2} dot={{ r: 2 }} />
                <Area type="monotone" dataKey="critical" name="Critical" stroke="#f43f5e" fill="url(#critGrad)" strokeWidth={2} dot={{ r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Need 2+ simulations</div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" /> Action Confidence & Completion
          </h3>
          <p className="text-xs text-slate-400 mb-4">Confidence score vs completion rate</p>
          {completionRateData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={completionRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="sim" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="avgConfidence" name="Avg confidence" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="completionRate" name="Completion rate" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Need 2+ simulations with actions</div>
          )}
        </Card>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" /> Role Influence Radar
          </h3>
          <p className="text-xs text-slate-400 mb-4">Comparative influence across top 8 roles</p>
          {radarData.length >= 3 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="role" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                <Radar name="Avg Influence" dataKey="avgInfluence" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                <Radar name="Appearances" dataKey="appearances" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Need 3+ unique roles</div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Outcome Success Rates
          </h3>
          <p className="text-xs text-slate-400 mb-4">Real-world tracked outcomes</p>
          {outcomeData && outcomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={outcomeData} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {outcomeData.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.name.includes('success') ? '#10b981'
                        : entry.name === 'failure' ? '#f43f5e'
                        : entry.name === 'abandoned' ? '#94a3b8'
                        : '#f59e0b'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center flex-col gap-2">
              <Clock className="w-8 h-8 text-slate-200" />
              <p className="text-slate-400 text-sm">No outcome data yet</p>
              <p className="text-slate-300 text-xs">Track real outcomes via SimulationOutcome entity</p>
            </div>
          )}
        </Card>
      </div>

      {/* Row 5: Scatter */}
      {tensionTrendData.length >= 3 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" /> Team Size vs Tension Volume
          </h3>
          <p className="text-xs text-slate-400 mb-4">Each dot = one simulation. X = roles, Y = tensions, size = confidence.</p>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="roles" name="Roles" type="number" tick={{ fontSize: 10 }} label={{ value: '# of Roles', position: 'insideBottom', offset: -4, fontSize: 10 }} />
              <YAxis dataKey="tensions" name="Tensions" type="number" tick={{ fontSize: 10 }} label={{ value: 'Tensions', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <ZAxis dataKey="avgConfidence" range={[30, 200]} name="Avg Confidence" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11 }} />
              <Scatter name="Simulations" data={tensionTrendData} fill="#8b5cf6" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}