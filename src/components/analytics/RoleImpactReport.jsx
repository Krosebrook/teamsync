import React, { useMemo, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import { ChevronDown, ChevronUp, Users, Target, TrendingUp } from 'lucide-react';

const COLORS = [
  '#8b5cf6','#3b82f6','#06b6d4','#f43f5e','#f59e0b',
  '#10b981','#ec4899','#6366f1','#84cc16','#f97316',
  '#a78bfa','#60a5fa','#34d399','#fb923c','#f472b6',
];

const RISK_SCORE = { low: 1, medium: 2, high: 3 };
const RISK_LABEL = { low: 'Conservative', medium: 'Balanced', high: 'Risk-Tolerant' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

function computeRoleImpact(simulations) {
  const map = {};

  simulations.forEach(sim => {
    const totalInfluence = sim.selected_roles?.reduce((a, r) => a + (r.influence || 5), 0) || 1;

    sim.responses?.forEach(resp => {
      const roleId = resp.role;
      const roleConf = sim.selected_roles?.find(r => r.role === roleId);
      const influence = roleConf?.influence || 5;

      if (!map[roleId]) {
        map[roleId] = {
          role: roleId,
          label: roleId.replace(/_/g, ' '),
          appearances: 0,
          totalInfluenceShare: 0,
          avgInfluenceSum: 0,
          riskScoreSum: 0,
          riskCount: 0,
          tensionInvolvement: 0,
          highPriorityActionsOwned: 0,
          actionsOwned: 0,
          confidenceSum: 0,
          confidenceCount: 0,
          primaryDrivers: {},
          recommendationsCount: 0,
        };
      }

      const r = map[roleId];
      r.appearances++;
      r.totalInfluenceShare += influence / totalInfluence;
      r.avgInfluenceSum += influence;

      if (resp.risk_tolerance) {
        r.riskScoreSum += RISK_SCORE[resp.risk_tolerance] || 2;
        r.riskCount++;
      }

      if (resp.primary_driver) {
        r.primaryDrivers[resp.primary_driver] = (r.primaryDrivers[resp.primary_driver] || 0) + 1;
      }

      if (resp.recommendation) r.recommendationsCount++;

      // Tensions this role is party to
      const involvedTensions = sim.tensions?.filter(t => t.between?.includes(roleId)) || [];
      r.tensionInvolvement += involvedTensions.length;

      // Actions owned
      const owned = sim.next_steps?.filter(ns => ns.owner_role === roleId) || [];
      r.actionsOwned += owned.length;
      r.highPriorityActionsOwned += owned.filter(ns => ns.priority === 'high').length;
      const confSum = owned.reduce((a, ns) => a + (ns.confidence || 0), 0);
      if (owned.length > 0) {
        r.confidenceSum += confSum / owned.length;
        r.confidenceCount++;
      }
    });
  });

  return Object.values(map).map(r => ({
    ...r,
    avgInfluenceShare: parseFloat(((r.totalInfluenceShare / r.appearances) * 100).toFixed(1)),
    avgInfluence: parseFloat((r.avgInfluenceSum / r.appearances).toFixed(1)),
    avgRiskScore: r.riskCount > 0 ? parseFloat((r.riskScoreSum / r.riskCount).toFixed(2)) : 2,
    avgTensionsPerSim: parseFloat((r.tensionInvolvement / r.appearances).toFixed(1)),
    avgActionsOwned: parseFloat((r.actionsOwned / r.appearances).toFixed(1)),
    avgActionConfidence: r.confidenceCount > 0 ? Math.round(r.confidenceSum / r.confidenceCount) : 0,
    topDriver: Object.entries(r.primaryDrivers).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
    // Composite impact score: influence share + action ownership + confidence, minus tension involvement
    impactScore: parseFloat((
      (r.totalInfluenceShare / r.appearances) * 40 +
      (r.actionsOwned / r.appearances) * 10 +
      (r.confidenceCount > 0 ? (r.confidenceSum / r.confidenceCount) / 100 * 30 : 0) -
      (r.tensionInvolvement / r.appearances) * 3
    ).toFixed(1)),
  })).sort((a, b) => b.impactScore - a.impactScore);
}

export default function RoleImpactReport({ simulations }) {
  const [expandedRole, setExpandedRole] = useState(null);
  const roleData = useMemo(() => computeRoleImpact(simulations), [simulations]);

  const radarData = useMemo(() => {
    return roleData.slice(0, 7).map(r => ({
      role: r.label.length > 14 ? r.label.slice(0, 14) + '…' : r.label,
      'Influence Share': r.avgInfluenceShare,
      'Action Ownership': Math.min(100, r.avgActionsOwned * 20),
      'Decision Confidence': r.avgActionConfidence,
      'Tension Risk': Math.min(100, r.avgTensionsPerSim * 25),
    }));
  }, [roleData]);

  const impactBarData = useMemo(() => roleData.slice(0, 12).map(r => ({
    label: r.label,
    impactScore: Math.max(0, r.impactScore),
  })), [roleData]);

  return (
    <div className="space-y-6">
      {/* Impact score bar */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-500" /> Role Impact Score Ranking
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Composite score based on influence share, action ownership, decision confidence, and tension involvement.
        </p>
        {impactBarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(180, impactBarData.length * 28)}>
            <BarChart data={impactBarData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 9 }} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="impactScore" name="Impact Score" radius={[0, 4, 4, 0]}>
                {impactBarData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data</div>
        )}
      </Card>

      {/* Multi-axis radar */}
      {radarData.length >= 3 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" /> Role Capability Radar
          </h3>
          <p className="text-xs text-slate-400 mb-4">Top 7 roles by impact score across four dimensions</p>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="role" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
              {radarData.map((r, i) => (
                <Radar key={r.role} name={r.role} dataKey="Influence Share"
                  stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.05} strokeWidth={1.5} />
              ))}
              <Radar name="Influence Share" dataKey="Influence Share" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Action Ownership" dataKey="Action Ownership" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
              <Radar name="Decision Confidence" dataKey="Decision Confidence" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
              <Radar name="Tension Risk" dataKey="Tension Risk" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.08} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Detailed role cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" /> Role-by-Role Impact Breakdown
        </h3>
        <div className="space-y-2">
          {roleData.map((r, i) => {
            const isExpanded = expandedRole === r.role;
            const riskLabel = RISK_LABEL[r.riskCount > 0 ? (r.avgRiskScore <= 1.5 ? 'low' : r.avgRiskScore <= 2.5 ? 'medium' : 'high') : 'medium'];
            return (
              <Card key={r.role} className="overflow-hidden">
                <button
                  className="w-full text-left p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedRole(isExpanded ? null : r.role)}
                >
                  {/* Rank badge */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-slate-800 capitalize">{r.label}</span>
                      <Badge variant="outline" className="text-xs h-5">{r.appearances} sims</Badge>
                      <Badge className="text-xs h-5" style={{ background: COLORS[i % COLORS.length] + '20', color: COLORS[i % COLORS.length], border: 'none' }}>
                        {riskLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 truncate">Top driver: {r.topDriver}</p>
                  </div>

                  {/* Mini metrics */}
                  <div className="hidden md:flex items-center gap-6 text-xs">
                    <div className="text-center">
                      <p className="font-semibold text-slate-800">{r.avgInfluenceShare}%</p>
                      <p className="text-slate-400">Influence</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-800">{r.avgActionsOwned}</p>
                      <p className="text-slate-400">Actions/sim</p>
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold ${r.avgTensionsPerSim > 2 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {r.avgTensionsPerSim}
                      </p>
                      <p className="text-slate-400">Tensions</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-violet-600">{Math.max(0, r.impactScore).toFixed(0)}</p>
                      <p className="text-slate-400">Score</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500 mb-1">Avg Influence</p>
                      <p className="font-semibold text-slate-800">{r.avgInfluence} / 10</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Influence Share</p>
                      <p className="font-semibold text-slate-800">{r.avgInfluenceShare}%</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Actions Owned</p>
                      <p className="font-semibold text-slate-800">{r.actionsOwned} total ({r.highPriorityActionsOwned} high)</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Action Confidence</p>
                      <p className="font-semibold text-slate-800">{r.avgActionConfidence}%</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Tension Involvement</p>
                      <p className={`font-semibold ${r.tensionInvolvement > 5 ? 'text-rose-600' : 'text-slate-800'}`}>{r.tensionInvolvement} total</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Risk Profile</p>
                      <p className="font-semibold text-slate-800">{riskLabel}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500 mb-1">Most Common Primary Driver</p>
                      <p className="font-medium text-slate-700 italic">"{r.topDriver}"</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}