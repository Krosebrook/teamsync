import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  BarChart3, TrendingUp, Users, AlertTriangle, Target, Zap,
  Calendar, Filter, Activity, Flame, CheckCircle2, Clock
} from 'lucide-react';
import { format, subDays, subMonths, isAfter, parseISO } from 'date-fns';

const ROLE_COLORS = [
  '#8b5cf6', '#3b82f6', '#06b6d4', '#f43f5e', '#f59e0b',
  '#10b981', '#ec4899', '#6366f1', '#84cc16', '#f97316',
];

const TENSION_COLORS = {
  critical: '#f43f5e',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981',
};

const DATE_RANGES = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
  { label: 'Last 6 months', value: '6m', days: 180 },
  { label: 'All time', value: 'all', days: null },
];

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  </Card>
);

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

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [roleFilter, setRoleFilter] = useState('all');
  const [useCaseFilter, setUseCaseFilter] = useState('all');

  const { data: simulations = [], isLoading } = useQuery({
    queryKey: ['simulations-analytics'],
    queryFn: () => base44.entities.Simulation.list('-created_date', 100),
    staleTime: 60_000,
  });

  const { data: outcomes = [] } = useQuery({
    queryKey: ['simulation-outcomes'],
    queryFn: () => base44.entities.SimulationOutcome.list('-created_date', 100),
    staleTime: 60_000,
  });

  // Filter simulations by date range
  const filteredSimulations = useMemo(() => {
    let result = simulations.filter(s => s.status === 'completed');
    const range = DATE_RANGES.find(r => r.value === dateRange);
    if (range?.days) {
      const cutoff = subDays(new Date(), range.days);
      result = result.filter(s => s.created_date && isAfter(parseISO(s.created_date), cutoff));
    }
    if (roleFilter !== 'all') {
      result = result.filter(s => s.selected_roles?.some(r => r.role === roleFilter));
    }
    if (useCaseFilter !== 'all') {
      result = result.filter(s => s.use_case_type === useCaseFilter);
    }
    return result;
  }, [simulations, dateRange, roleFilter, useCaseFilter]);

  // All unique roles across all simulations for filter dropdown
  const allRoles = useMemo(() => {
    const roles = new Set(simulations.flatMap(s => s.selected_roles?.map(r => r.role) || []));
    return Array.from(roles).sort();
  }, [simulations]);

  // All unique use case types
  const allUseCases = useMemo(() => {
    const types = new Set(simulations.map(s => s.use_case_type).filter(Boolean));
    return Array.from(types).sort();
  }, [simulations]);

  // --- CHART DATA ---

  // 1. Simulations over time (bar chart)
  const simsOverTime = useMemo(() => {
    if (!filteredSimulations.length) return [];
    const byDate = {};
    filteredSimulations.forEach(s => {
      if (!s.created_date) return;
      const d = format(parseISO(s.created_date), 'MMM d');
      byDate[d] = (byDate[d] || 0) + 1;
    });
    return Object.entries(byDate).map(([date, count]) => ({ date, count })).slice(-20);
  }, [filteredSimulations]);

  // 2. Role influence distribution
  const roleInfluenceData = useMemo(() => {
    const roleMap = {};
    filteredSimulations.forEach(s => {
      s.selected_roles?.forEach(r => {
        if (!roleMap[r.role]) roleMap[r.role] = { role: r.role, totalInfluence: 0, count: 0, appearances: 0 };
        roleMap[r.role].totalInfluence += r.influence || 5;
        roleMap[r.role].count++;
        roleMap[r.role].appearances++;
      });
    });
    return Object.values(roleMap)
      .map(r => ({
        ...r,
        avgInfluence: parseFloat((r.totalInfluence / r.count).toFixed(1)),
        role: r.role.replace(/_/g, ' '),
      }))
      .sort((a, b) => b.appearances - a.appearances)
      .slice(0, 12);
  }, [filteredSimulations]);

  // 3. Tension severity breakdown (pie)
  const tensionSeverityData = useMemo(() => {
    const severity = { critical: 0, high: 0, medium: 0, low: 0 };
    filteredSimulations.forEach(s => {
      s.tensions?.forEach(t => {
        if (severity[t.severity] !== undefined) severity[t.severity]++;
      });
    });
    return Object.entries(severity)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredSimulations]);

  // 4. Avg tensions per simulation trend line
  const tensionTrendData = useMemo(() => {
    return filteredSimulations
      .slice()
      .reverse()
      .map((s, i) => ({
        sim: i + 1,
        title: s.title?.slice(0, 20) || `Sim ${i + 1}`,
        tensions: s.tensions?.length || 0,
        critical: s.tensions?.filter(t => t.severity === 'critical').length || 0,
        roles: s.selected_roles?.length || 0,
        avgConfidence: s.next_steps?.length
          ? Math.round(s.next_steps.reduce((a, ns) => a + (ns.confidence || 0), 0) / s.next_steps.length)
          : 0,
        completedSteps: s.next_steps?.filter(ns => ns.completed).length || 0,
        totalSteps: s.next_steps?.length || 0,
      }));
  }, [filteredSimulations]);

  // 5. Use case distribution
  const useCaseData = useMemo(() => {
    const counts = {};
    filteredSimulations.forEach(s => {
      const k = s.use_case_type || 'custom';
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSimulations]);

  // 6. Role radar — avg influence per top role
  const radarData = useMemo(() => {
    return roleInfluenceData.slice(0, 8).map(r => ({
      role: r.role.length > 12 ? r.role.slice(0, 12) + '…' : r.role,
      avgInfluence: r.avgInfluence,
      appearances: r.appearances,
    }));
  }, [roleInfluenceData]);

  // 7. Outcome success rates
  const outcomeData = useMemo(() => {
    if (!outcomes.length) return null;
    const counts = { success: 0, partial_success: 0, failure: 0, abandoned: 0, ongoing: 0 };
    outcomes.forEach(o => {
      if (counts[o.actual_outcome] !== undefined) counts[o.actual_outcome]++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  }, [outcomes]);

  // 8. Action completion rate trend
  const completionRateData = useMemo(() => {
    return tensionTrendData
      .filter(d => d.totalSteps > 0)
      .map(d => ({
        ...d,
        completionRate: Math.round((d.completedSteps / d.totalSteps) * 100),
      }));
  }, [tensionTrendData]);

  // Summary stats
  const stats = useMemo(() => {
    const allTensions = filteredSimulations.flatMap(s => s.tensions || []);
    const allSteps = filteredSimulations.flatMap(s => s.next_steps || []);
    const completedSteps = allSteps.filter(s => s.completed);
    const avgConfidence = allSteps.length
      ? Math.round(allSteps.reduce((a, s) => a + (s.confidence || 0), 0) / allSteps.length)
      : 0;
    return {
      total: filteredSimulations.length,
      criticalTensions: allTensions.filter(t => t.severity === 'critical').length,
      actionCompletionRate: allSteps.length ? Math.round((completedSteps.length / allSteps.length) * 100) : 0,
      avgConfidence,
    };
  }, [filteredSimulations]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Activity className="w-8 h-8 animate-pulse" />
          <p className="text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">Decision Analytics</h1>
              <p className="text-xs text-slate-500">Visualize team decision-making trends over time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Activity className="w-3 h-3" />
              {stats.total} simulations
            </Badge>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-8 text-xs w-40">
              <Calendar className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(r => (
                <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 text-xs w-44">
              <Users className="w-3 h-3 mr-1" />
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All roles</SelectItem>
              {allRoles.map(r => (
                <SelectItem key={r} value={r} className="text-xs">{r.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={useCaseFilter} onValueChange={setUseCaseFilter}>
            <SelectTrigger className="h-8 text-xs w-44">
              <Zap className="w-3 h-3 mr-1" />
              <SelectValue placeholder="All use cases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All use cases</SelectItem>
              {allUseCases.map(u => (
                <SelectItem key={u} value={u} className="text-xs">{u.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(dateRange !== '30d' || roleFilter !== 'all' || useCaseFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-slate-500"
              onClick={() => { setDateRange('30d'); setRoleFilter('all'); setUseCaseFilter('all'); }}
            >
              Reset
            </Button>
          )}
        </div>

        {filteredSimulations.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No simulations match your filters</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting the date range or removing filters</p>
          </Card>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={BarChart3} label="Simulations" value={stats.total} color="bg-violet-100 text-violet-600" />
              <StatCard icon={AlertTriangle} label="Critical Tensions" value={stats.criticalTensions} color="bg-rose-100 text-rose-600" />
              <StatCard icon={CheckCircle2} label="Action Completion" value={`${stats.actionCompletionRate}%`} color="bg-emerald-100 text-emerald-600" />
              <StatCard icon={Target} label="Avg Confidence" value={`${stats.avgConfidence}%`} color="bg-blue-100 text-blue-600" sub="of recommended actions" />
            </div>

            {/* Row 1: Simulations over time + Use case breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-500" />
                  Simulations Over Time
                </h3>
                <p className="text-xs text-slate-400 mb-4">Number of completed simulations by date</p>
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
                  <Zap className="w-4 h-4 text-amber-500" />
                  Decision Types
                </h3>
                <p className="text-xs text-slate-400 mb-4">By use case category</p>
                {useCaseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={useCaseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {useCaseData.map((_, i) => (
                          <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ fontSize: 11 }} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>
                )}
              </Card>
            </div>

            {/* Row 2: Role influence + Tension severity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Role Influence Patterns
                </h3>
                <p className="text-xs text-slate-400 mb-4">Average influence weight by role (across all filtered simulations)</p>
                {roleInfluenceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={roleInfluenceData} layout="vertical" barSize={12}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
                      <YAxis dataKey="role" type="category" tick={{ fontSize: 9 }} width={90} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="avgInfluence" name="Avg Influence" radius={[0, 3, 3, 0]}>
                        {roleInfluenceData.map((_, i) => (
                          <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No role data</div>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  Tension Severity Breakdown
                </h3>
                <p className="text-xs text-slate-400 mb-4">Distribution of conflict severity across all simulations</p>
                {tensionSeverityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={tensionSeverityData}
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {tensionSeverityData.map((entry) => (
                          <Cell key={entry.name} fill={TENSION_COLORS[entry.name] || '#94a3b8'} />
                        ))}
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

            {/* Row 3: Tension trend + Confidence trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Tensions Per Simulation
                </h3>
                <p className="text-xs text-slate-400 mb-4">Total vs critical tensions over simulation history</p>
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
                      <XAxis dataKey="sim" tick={{ fontSize: 10 }} label={{ value: 'Simulation #', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Area type="monotone" dataKey="tensions" name="Total tensions" stroke="#f59e0b" fill="url(#totalGrad)" strokeWidth={2} dot={{ r: 2 }} />
                      <Area type="monotone" dataKey="critical" name="Critical" stroke="#f43f5e" fill="url(#critGrad)" strokeWidth={2} dot={{ r: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Need 2+ simulations</div>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  Action Confidence & Completion
                </h3>
                <p className="text-xs text-slate-400 mb-4">Average confidence score and completion rate per simulation</p>
                {completionRateData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={completionRateData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="sim" tick={{ fontSize: 10 }} label={{ value: 'Simulation #', position: 'insideBottom', offset: -4, fontSize: 10 }} />
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

            {/* Row 4: Role radar + Outcome success rates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-500" />
                  Role Influence Radar
                </h3>
                <p className="text-xs text-slate-400 mb-4">Comparative influence levels across top 8 roles</p>
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
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Outcome Success Rates
                </h3>
                <p className="text-xs text-slate-400 mb-4">Tracked real-world outcomes from simulation outcomes log</p>
                {outcomeData && outcomeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={outcomeData} barSize={30}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                        {outcomeData.map((entry, i) => {
                          const color = entry.name.includes('success') ? '#10b981'
                            : entry.name === 'failure' ? '#f43f5e'
                            : entry.name === 'abandoned' ? '#94a3b8'
                            : '#f59e0b';
                          return <Cell key={i} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-56 flex items-center justify-center flex-col gap-2">
                    <Clock className="w-8 h-8 text-slate-200" />
                    <p className="text-slate-400 text-sm">No outcome data yet</p>
                    <p className="text-slate-300 text-xs">Track real outcomes via the Simulation Outcomes entity</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Row 5: Scatter — roles vs tensions */}
            {tensionTrendData.length >= 3 && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Team Size vs Tension Volume
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Each dot = one simulation. X = number of roles, Y = total tensions. Dot size = confidence score.
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="roles" name="Roles" type="number" tick={{ fontSize: 10 }} label={{ value: '# of Roles', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                    <YAxis dataKey="tensions" name="Tensions" type="number" tick={{ fontSize: 10 }} label={{ value: 'Tensions', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <ZAxis dataKey="avgConfidence" range={[30, 200]} name="Avg Confidence" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11 }}
                      formatter={(value, name) => [value, name === 'avgConfidence' ? 'Confidence' : name]} />
                    <Scatter name="Simulations" data={tensionTrendData} fill="#8b5cf6" fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}