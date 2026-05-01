import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Activity, CheckCircle2, AlertTriangle, Zap, TrendingUp, Users, ArrowRight, Flame
} from 'lucide-react';
import { format, subDays, startOfDay, parseISO, isAfter } from 'date-fns';

const USE_CASE_LABELS = {
  pre_mortem: 'Pre-Mortem',
  roadmap: 'Roadmap',
  adr: 'Architecture',
  pmf_validation: 'PMF',
  tech_debt: 'Tech Debt',
  post_mortem: 'Post-Mortem',
  hiring: 'Hiring',
  build_buy: 'Build vs Buy',
  migration: 'Migration',
  customer_escalation: 'Escalation',
  custom: 'Custom',
};

const TENSION_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' };
const CHART_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#22c55e', '#ec4899', '#8b5cf6', '#14b8a6'];

function StatCard({ icon: Icon, label, value, sub, color = 'slate' }) {
  const colorMap = {
    slate: 'bg-slate-50 text-slate-700',
    violet: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: simulations = [], isLoading } = useQuery({
    queryKey: ['simulations-dashboard'],
    queryFn: () => base44.entities.Simulation.list('-created_date', 100),
  });

  const stats = useMemo(() => {
    const completed = simulations.filter(s => s.status === 'completed');
    const allTensions = completed.flatMap(s => s.tensions || []);
    const criticalCount = allTensions.filter(t => t.severity === 'critical' || t.severity === 'high').length;
    const avgNextSteps = completed.length
      ? (completed.reduce((sum, s) => sum + (s.next_steps?.length || 0), 0) / completed.length).toFixed(1)
      : 0;
    const uniqueRoles = new Set(simulations.flatMap(s => (s.selected_roles || []).map(r => r.role))).size;

    return { total: simulations.length, completed: completed.length, criticalCount, avgNextSteps, uniqueRoles };
  }, [simulations]);

  // Simulations over the last 14 days
  const activityData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = startOfDay(subDays(new Date(), 13 - i));
      return { date: format(d, 'MMM d'), day: d, count: 0 };
    });
    simulations.forEach(s => {
      const created = new Date(s.created_date);
      const idx = days.findIndex((d, i) => {
        const next = days[i + 1];
        return isAfter(created, d.day) && (!next || !isAfter(created, next.day));
      });
      if (idx >= 0) days[idx].count++;
    });
    return days.map(({ date, count }) => ({ date, count }));
  }, [simulations]);

  // Use case breakdown
  const useCaseData = useMemo(() => {
    const counts = {};
    simulations.forEach(s => {
      const key = s.use_case_type || 'custom';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, value]) => ({ name: USE_CASE_LABELS[key] || key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [simulations]);

  // Tension severity distribution
  const tensionData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    simulations.forEach(s =>
      (s.tensions || []).forEach(t => { if (counts[t.severity] !== undefined) counts[t.severity]++; })
    );
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: TENSION_COLORS[name] }));
  }, [simulations]);

  // Role frequency
  const roleData = useMemo(() => {
    const counts = {};
    simulations.forEach(s =>
      (s.selected_roles || []).forEach(r => { counts[r.role] = (counts[r.role] || 0) + 1; })
    );
    return Object.entries(counts)
      .map(([role, count]) => ({ role: role.replace(/_/g, ' '), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [simulations]);

  // Next step completion rate
  const completionData = useMemo(() => {
    const completed = simulations.filter(s => s.status === 'completed' && s.next_steps?.length > 0);
    return completed.slice(0, 8).map(s => {
      const steps = s.next_steps || [];
      const done = steps.filter(st => st.completed).length;
      return {
        name: s.title?.slice(0, 18) + (s.title?.length > 18 ? '…' : '') || 'Untitled',
        total: steps.length,
        done,
        pending: steps.length - done,
      };
    });
  }, [simulations]);

  const recentSims = simulations.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="w-7 h-7 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Activity overview across all simulations</p>
        </div>
        <Link
          to="/Simulation"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-200 bg-white rounded-lg px-3 py-2 transition-colors hover:bg-slate-50"
        >
          Go to Workspace <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Activity} label="Total Simulations" value={stats.total} color="slate" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} sub={`${stats.total ? Math.round(stats.completed / stats.total * 100) : 0}% success rate`} color="emerald" />
        <StatCard icon={Flame} label="High/Critical Tensions" value={stats.criticalCount} color="rose" />
        <StatCard icon={Zap} label="Avg Next Steps" value={stats.avgNextSteps} sub="per simulation" color="amber" />
        <StatCard icon={Users} label="Unique Roles Used" value={stats.uniqueRoles} color="violet" />
      </div>

      {/* Row 2: Activity + Use Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Simulation Activity — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="count" name="Simulations" stroke="#6366f1" strokeWidth={2} fill="url(#actGrad)" dot={{ r: 3, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Use case pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Use Case Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {useCaseData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={useCaseData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {useCaseData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Role frequency + Tensions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Role frequency */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Most Used Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {roleData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={roleData} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="role" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" name="Uses" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tension severity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Tension Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {tensionData.every(t => t.value === 0) ? (
              <p className="text-xs text-slate-400 text-center py-12">No tension data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tensionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {tensionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Next-step completion + Recent simulations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Next step completion */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Next Step Completion</CardTitle>
          </CardHeader>
          <CardContent>
            {completionData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">No completed simulations yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={completionData} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={100} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="done" name="Done" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#e2e8f0" radius={[0, 4, 4, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent simulations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Recent Simulations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentSims.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">No simulations yet</p>
            ) : recentSims.map(sim => {
              const hasCritical = sim.tensions?.some(t => t.severity === 'critical');
              const hasHigh = sim.tensions?.some(t => t.severity === 'high');
              return (
                <div key={sim.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{sim.title || 'Untitled'}</p>
                    <p className="text-xs text-slate-500">{format(new Date(sim.created_date), 'MMM d, yyyy')} · {sim.selected_roles?.length || 0} roles</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 shrink-0">
                    {hasCritical && <Badge className="text-xs bg-violet-100 text-violet-700 border-0">Critical</Badge>}
                    {!hasCritical && hasHigh && <Badge className="text-xs bg-rose-100 text-rose-700 border-0">High</Badge>}
                    <Badge variant="outline" className={`text-xs ${sim.status === 'completed' ? 'text-emerald-700 border-emerald-200' : 'text-slate-500'}`}>
                      {sim.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}