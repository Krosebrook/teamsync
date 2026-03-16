import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, TrendingUp, Users, AlertTriangle, Target, Zap,
  Calendar, Filter, Activity, Flame, CheckCircle2, Clock,
  RefreshCw, Wifi, WifiOff, ArrowLeft
} from 'lucide-react';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { createPageUrl } from '@/utils';
import SensitivityDashboard from '../components/analytics/SensitivityDashboard';
import KnowledgeGraphView from '../components/analytics/KnowledgeGraphView';
import NLQueryPanel from '../components/analytics/NLQueryPanel';
import CoreChartsGrid from '../components/analytics/CoreChartsGrid';
import InfluenceDistribution from '../components/analytics/InfluenceDistribution';
import ConsensusTrends from '../components/analytics/ConsensusTrends';
import RoleImpactReport from '../components/analytics/RoleImpactReport';

const DATE_RANGES = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
  { label: 'Last 6 months', value: '6m', days: 180 },
  { label: 'All time', value: 'all', days: null },
];

const StatCard = ({ icon: Icon, label, value, color, sub, delta }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
      {delta !== undefined && (
        <span className={`text-xs font-semibold ${delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
          {delta >= 0 ? '+' : ''}{delta}%
        </span>
      )}
    </div>
  </Card>
);

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('30d');
  const [roleFilter, setRoleFilter] = useState('all');
  const [useCaseFilter, setUseCaseFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // ── Live data fetching with real-time subscription ─────────────────────────
  const { data: simulations = [], isLoading } = useQuery({
    queryKey: ['simulations-analytics'],
    queryFn: () => base44.entities.Simulation.list('-created_date', 200),
    staleTime: 0,
    refetchInterval: isLive ? 30_000 : false,
  });

  const { data: outcomes = [] } = useQuery({
    queryKey: ['simulation-outcomes'],
    queryFn: () => base44.entities.SimulationOutcome.list('-created_date', 200),
    staleTime: 0,
    refetchInterval: isLive ? 30_000 : false,
  });

  // Real-time subscription — invalidates query whenever any simulation changes
  useEffect(() => {
    if (!isLive) return;
    const unsub = base44.entities.Simulation.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        queryClient.invalidateQueries({ queryKey: ['simulations-analytics'] });
        setLastUpdated(new Date());
      }
    });
    return unsub;
  }, [isLive, queryClient]);

  useEffect(() => {
    if (!isLive) return;
    const unsub = base44.entities.SimulationOutcome.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['simulation-outcomes'] });
      setLastUpdated(new Date());
    });
    return unsub;
  }, [isLive, queryClient]);

  const manualRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['simulations-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['simulation-outcomes'] });
    setLastUpdated(new Date());
  }, [queryClient]);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filteredSimulations = useMemo(() => {
    let result = simulations.filter(s => s.status === 'completed');
    const range = DATE_RANGES.find(r => r.value === dateRange);
    if (range?.days) {
      const cutoff = subDays(new Date(), range.days);
      result = result.filter(s => s.created_date && isAfter(parseISO(s.created_date), cutoff));
    }
    if (roleFilter !== 'all') result = result.filter(s => s.selected_roles?.some(r => r.role === roleFilter));
    if (useCaseFilter !== 'all') result = result.filter(s => s.use_case_type === useCaseFilter);
    return result;
  }, [simulations, dateRange, roleFilter, useCaseFilter]);

  const allRoles = useMemo(() => {
    const roles = new Set(simulations.flatMap(s => s.selected_roles?.map(r => r.role) || []));
    return Array.from(roles).sort();
  }, [simulations]);

  const allUseCases = useMemo(() => {
    const types = new Set(simulations.map(s => s.use_case_type).filter(Boolean));
    return Array.from(types).sort();
  }, [simulations]);

  // ── Summary stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const allTensions = filteredSimulations.flatMap(s => s.tensions || []);
    const allSteps = filteredSimulations.flatMap(s => s.next_steps || []);
    const completedSteps = allSteps.filter(s => s.completed);
    const avgConfidence = allSteps.length
      ? Math.round(allSteps.reduce((a, s) => a + (s.confidence || 0), 0) / allSteps.length)
      : 0;
    const uniqueRoles = new Set(filteredSimulations.flatMap(s => s.selected_roles?.map(r => r.role) || [])).size;
    return {
      total: filteredSimulations.length,
      criticalTensions: allTensions.filter(t => t.severity === 'critical').length,
      actionCompletionRate: allSteps.length ? Math.round((completedSteps.length / allSteps.length) * 100) : 0,
      avgConfidence,
      uniqueRoles,
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
            <a href={createPageUrl('Simulation')} className="p-1.5 rounded hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </a>
            <div className="w-8 h-8 bg-slate-800 flex items-center justify-center rounded">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">Decision Analytics</h1>
              <p className="text-xs text-slate-500">Live team decision-making intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <button
              onClick={() => setIsLive(l => !l)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                isLive
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isLive ? 'Live' : 'Paused'}
            </button>
            <span className="text-xs text-slate-400 hidden sm:block">
              Updated {format(lastUpdated, 'HH:mm:ss')}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={manualRefresh} title="Refresh now">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
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
            <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500"
              onClick={() => { setDateRange('30d'); setRoleFilter('all'); setUseCaseFilter('all'); }}>
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard icon={BarChart3} label="Simulations" value={stats.total} color="bg-violet-100 text-violet-600" />
              <StatCard icon={AlertTriangle} label="Critical Tensions" value={stats.criticalTensions} color="bg-rose-100 text-rose-600" />
              <StatCard icon={CheckCircle2} label="Action Completion" value={`${stats.actionCompletionRate}%`} color="bg-emerald-100 text-emerald-600" />
              <StatCard icon={Target} label="Avg Confidence" value={`${stats.avgConfidence}%`} color="bg-blue-100 text-blue-600" sub="of recommended actions" />
              <StatCard icon={Users} label="Unique Roles" value={stats.uniqueRoles} color="bg-amber-100 text-amber-600" />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white border border-slate-200 p-1 h-auto gap-1">
                <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-slate-100 data-[state=active]:shadow-none rounded px-3 py-1.5">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="sensitivity" className="text-xs data-[state=active]:bg-slate-100 data-[state=active]:shadow-none rounded px-3 py-1.5">
                  Sensitivity Analysis
                </TabsTrigger>
                <TabsTrigger value="graph" className="text-xs data-[state=active]:bg-slate-100 data-[state=active]:shadow-none rounded px-3 py-1.5">
                  Knowledge Graph
                </TabsTrigger>
                <TabsTrigger value="query" className="text-xs data-[state=active]:bg-slate-100 data-[state=active]:shadow-none rounded px-3 py-1.5">
                  NL Query
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <CoreChartsGrid simulations={filteredSimulations} outcomes={outcomes} />
              </TabsContent>

              <TabsContent value="sensitivity" className="mt-6">
                <SensitivityDashboard simulations={filteredSimulations} />
              </TabsContent>

              <TabsContent value="graph" className="mt-6">
                <KnowledgeGraphView simulations={filteredSimulations} />
              </TabsContent>

              <TabsContent value="query" className="mt-6">
                <NLQueryPanel simulations={simulations} outcomes={outcomes} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}