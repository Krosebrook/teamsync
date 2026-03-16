import React, { useMemo } from 'react';
import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs max-w-[220px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500 truncate">{p.name}:</span>
          <span className="font-medium text-slate-800">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Derives a "consensus score" for a simulation:
 * - Higher avg confidence = more consensus
 * - Fewer tensions (relative to role count) = more consensus
 * - More aligned risk tolerances = more consensus
 */
function computeConsensusScore(sim) {
  const steps = sim.next_steps || [];
  const tensions = sim.tensions || [];
  const roles = sim.selected_roles || [];
  const responses = sim.responses || [];

  const avgConf = steps.length
    ? steps.reduce((a, s) => a + (s.confidence || 0), 0) / steps.length
    : 50;

  const tensionPenalty = roles.length > 0
    ? Math.min(40, (tensions.length / Math.max(1, roles.length)) * 15)
    : 0;

  const criticalPenalty = tensions.filter(t => t.severity === 'critical').length * 8;

  // Risk tolerance agreement
  const tolerances = responses.map(r => r.risk_tolerance);
  const toleranceCounts = { low: 0, medium: 0, high: 0 };
  tolerances.forEach(t => { if (toleranceCounts[t] !== undefined) toleranceCounts[t]++; });
  const dominantCount = Math.max(...Object.values(toleranceCounts));
  const alignmentBonus = tolerances.length > 0 ? (dominantCount / tolerances.length) * 10 : 0;

  return Math.max(0, Math.min(100, avgConf - tensionPenalty - criticalPenalty + alignmentBonus));
}

export default function ConsensusTrends({ simulations }) {
  const trendData = useMemo(() => {
    return simulations
      .slice()
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      .map((s, i) => {
        const score = computeConsensusScore(s);
        const date = s.created_date ? format(parseISO(s.created_date), 'MMM d') : `#${i + 1}`;
        const avgConf = s.next_steps?.length
          ? Math.round(s.next_steps.reduce((a, ns) => a + (ns.confidence || 0), 0) / s.next_steps.length)
          : 0;
        return {
          index: i + 1,
          date,
          label: s.title?.slice(0, 22) || `Sim ${i + 1}`,
          consensusScore: parseFloat(score.toFixed(1)),
          avgConfidence: avgConf,
          tensions: s.tensions?.length || 0,
          criticalTensions: s.tensions?.filter(t => t.severity === 'critical').length || 0,
          roleCount: s.selected_roles?.length || 0,
        };
      });
  }, [simulations]);

  // Moving average (window=3)
  const trendWithMA = useMemo(() => {
    return trendData.map((d, i) => {
      const window = trendData.slice(Math.max(0, i - 2), i + 1);
      const ma = parseFloat((window.reduce((a, x) => a + x.consensusScore, 0) / window.length).toFixed(1));
      return { ...d, movingAvg: ma };
    });
  }, [trendData]);

  // Overall trend direction
  const trend = useMemo(() => {
    if (trendData.length < 2) return 'neutral';
    const first = trendData.slice(0, Math.ceil(trendData.length / 2));
    const last = trendData.slice(Math.floor(trendData.length / 2));
    const firstAvg = first.reduce((a, d) => a + d.consensusScore, 0) / first.length;
    const lastAvg = last.reduce((a, d) => a + d.consensusScore, 0) / last.length;
    if (lastAvg - firstAvg > 3) return 'up';
    if (firstAvg - lastAvg > 3) return 'down';
    return 'neutral';
  }, [trendData]);

  const overallAvg = useMemo(() => {
    if (!trendData.length) return 0;
    return parseFloat((trendData.reduce((a, d) => a + d.consensusScore, 0) / trendData.length).toFixed(1));
  }, [trendData]);

  // Consensus buckets
  const consensusBuckets = useMemo(() => {
    const buckets = { 'High (75+)': 0, 'Medium (50-74)': 0, 'Low (<50)': 0 };
    trendData.forEach(d => {
      if (d.consensusScore >= 75) buckets['High (75+)']++;
      else if (d.consensusScore >= 50) buckets['Medium (50-74)']++;
      else buckets['Low (<50)']++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [trendData]);

  const bucketColors = { 'High (75+)': '#10b981', 'Medium (50-74)': '#f59e0b', 'Low (<50)': '#f43f5e' };

  const scoreColor = (score) => score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600';
  const scoreBg = (score) => score >= 75 ? 'bg-emerald-50 border-emerald-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={`p-4 border ${scoreBg(overallAvg)}`}>
          <p className="text-xs text-slate-500 mb-1">Overall Consensus Score</p>
          <p className={`text-3xl font-bold ${scoreColor(overallAvg)}`}>{overallAvg}</p>
          <p className="text-xs text-slate-400 mt-0.5">out of 100</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Trend Direction</p>
          <div className="flex items-center gap-2">
            {trend === 'up' && <TrendingUp className="w-6 h-6 text-emerald-500" />}
            {trend === 'down' && <TrendingDown className="w-6 h-6 text-rose-500" />}
            {trend === 'neutral' && <Minus className="w-6 h-6 text-slate-400" />}
            <span className="text-lg font-semibold capitalize text-slate-700">{trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">over the period</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-2">Consensus Distribution</p>
          <div className="space-y-1">
            {consensusBuckets.map(b => (
              <div key={b.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: bucketColors[b.name] }} />
                <span className="text-slate-500 flex-1">{b.name}</span>
                <span className="font-semibold text-slate-700">{b.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Main consensus trend line */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" /> Consensus Score Over Time
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Derived from action confidence, tension density, and risk tolerance alignment. Higher = more team agreement.
        </p>
        {trendWithMA.length > 1 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendWithMA}>
              <defs>
                <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 2" label={{ value: 'High', position: 'right', fontSize: 9, fill: '#10b981' }} />
              <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Med', position: 'right', fontSize: 9, fill: '#f59e0b' }} />
              <Area type="monotone" dataKey="consensusScore" name="Consensus Score" stroke="#8b5cf6" fill="url(#consGrad)" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
              <Line type="monotone" dataKey="movingAvg" name="3-sim Moving Avg" stroke="#06b6d4" strokeWidth={2} dot={false} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Need 2+ simulations</div>
        )}
      </Card>

      {/* Confidence vs Tensions side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Avg Action Confidence Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Confidence in recommended actions — a proxy for decisiveness</p>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avgConfidence" name="Avg Confidence" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Need 2+ simulations</div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Tension Count per Simulation</h3>
          <p className="text-xs text-slate-400 mb-4">Total vs critical tensions — fewer = higher alignment</p>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="tensions" name="Total Tensions" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="criticalTensions" name="Critical" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data</div>
          )}
        </Card>
      </div>

      {/* Simulation-level detail table */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Consensus Score Per Simulation</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-4 text-slate-500 font-medium">#</th>
                <th className="text-left py-2 pr-4 text-slate-500 font-medium">Simulation</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Date</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Consensus</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Confidence</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Tensions</th>
              </tr>
            </thead>
            <tbody>
              {trendData.map((d) => (
                <tr key={d.index} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 pr-4 text-slate-400">{d.index}</td>
                  <td className="py-2 pr-4 font-medium text-slate-800 max-w-[200px] truncate">{d.label}</td>
                  <td className="text-right py-2 px-3 text-slate-500">{d.date}</td>
                  <td className="text-right py-2 px-3">
                    <span className={`font-semibold ${scoreColor(d.consensusScore)}`}>
                      {d.consensusScore}
                    </span>
                  </td>
                  <td className="text-right py-2 px-3 text-slate-600">{d.avgConfidence}%</td>
                  <td className="text-right py-2 px-3">
                    <span className="text-slate-600">{d.tensions}</span>
                    {d.criticalTensions > 0 && (
                      <span className="ml-1 text-rose-500">({d.criticalTensions}⚡)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}