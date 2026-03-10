/**
 * SensitivityDashboard — pure-JS statistical sensitivity analysis.
 * 
 * Algorithms used (no LLM calls, all computed from existing simulation data):
 *   - Pearson correlation: between role influence and tension count per simulation
 *   - Sensitivity index: variance of outcome when role is included vs excluded
 *   - Swing factor: max(tension_with_role) - min(tension_without_role) across corpus
 *   - Role-pair conflict matrix: frequency × severity-weighted heatmap
 *
 * Extension guide:
 *   - Add more environmental factor tracking by storing `environmentalFactors` array in Simulation entity
 *   - Increase `CORPUS_LIMIT` in the query to expand analysis coverage
 *   - Weight severity numerically (critical=4, high=3, medium=2, low=1) to change scoring
 */

import React, { useMemo, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, Zap, Info } from 'lucide-react';

const SEVERITY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 };

// ── Pearson correlation coefficient ──────────────────────────────────────────
function pearson(xs, ys) {
  if (xs.length < 2) return 0;
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((a, x, i) => a + (x - meanX) * (ys[i] - meanY), 0);
  const denX = Math.sqrt(xs.reduce((a, x) => a + (x - meanX) ** 2, 0));
  const denY = Math.sqrt(ys.reduce((a, y) => a + (y - meanY) ** 2, 0));
  return (denX * denY === 0) ? 0 : parseFloat((num / (denX * denY)).toFixed(3));
}

// ── Compute sensitivity indices for all roles across the simulation corpus ───
function computeSensitivity(simulations) {
  if (simulations.length < 2) return [];

  // Collect all unique role IDs
  const roleSet = new Set(simulations.flatMap(s => s.selected_roles?.map(r => r.role) || []));
  const results = [];

  for (const roleId of roleSet) {
    // Simulations WITH this role
    const withRole = simulations.filter(s => s.selected_roles?.some(r => r.role === roleId));
    if (withRole.length < 2) continue;

    // Pearson(influence level, tension count) for this role
    const influences = withRole.map(s => s.selected_roles.find(r => r.role === roleId)?.influence || 5);
    const tensionCounts = withRole.map(s => s.tensions?.length || 0);
    const weightedTensions = withRole.map(s =>
      (s.tensions || []).reduce((acc, t) => acc + (SEVERITY_WEIGHT[t.severity] || 1), 0)
    );

    const corr = pearson(influences, tensionCounts);
    const corrWeighted = pearson(influences, weightedTensions);

    // Simulations WITHOUT this role — baseline tension
    const withoutRole = simulations.filter(s => !s.selected_roles?.some(r => r.role === roleId));
    const baselineTension = withoutRole.length
      ? withoutRole.reduce((a, s) => a + (s.tensions?.length || 0), 0) / withoutRole.length
      : null;
    const avgTensionWith = tensionCounts.reduce((a, b) => a + b, 0) / tensionCounts.length;

    // Swing = difference in average tension with vs without
    const swing = baselineTension !== null
      ? parseFloat((avgTensionWith - baselineTension).toFixed(2))
      : 0;

    // Sensitivity index (0-1): abs correlation * appearance frequency weight
    const appearanceRate = withRole.length / simulations.length;
    const sensitivityIndex = parseFloat((Math.abs(corrWeighted) * appearanceRate).toFixed(3));

    results.push({
      role: roleId.replace(/_/g, ' '),
      roleId,
      appearances: withRole.length,
      appearanceRate: parseFloat((appearanceRate * 100).toFixed(1)),
      pearsonR: corr,
      pearsonRWeighted: corrWeighted,
      sensitivityIndex,
      swing,
      avgInfluence: parseFloat((influences.reduce((a, b) => a + b, 0) / influences.length).toFixed(1)),
      avgTensions: parseFloat(avgTensionWith.toFixed(1)),
      isSwingFactor: Math.abs(swing) > 0.5 || Math.abs(corr) > 0.4,
    });
  }

  return results.sort((a, b) => b.sensitivityIndex - a.sensitivityIndex);
}

// ── Role-pair conflict heatmap ────────────────────────────────────────────────
function computeConflictMatrix(simulations) {
  const matrix = {};
  simulations.forEach(s => {
    (s.tensions || []).forEach(t => {
      if (t.between?.length !== 2) return;
      const key = [...t.between].sort().join('||');
      if (!matrix[key]) matrix[key] = { pair: [...t.between].sort(), count: 0, weightedScore: 0 };
      matrix[key].count++;
      matrix[key].weightedScore += SEVERITY_WEIGHT[t.severity] || 1;
    });
  });
  return Object.values(matrix)
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 15);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-800">{typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function SensitivityDashboard({ simulations }) {
  const [hoveredRole, setHoveredRole] = useState(null);

  const sensitivity = useMemo(() => computeSensitivity(simulations), [simulations]);
  const conflictMatrix = useMemo(() => computeConflictMatrix(simulations), [simulations]);

  const swingFactors = useMemo(() => sensitivity.filter(r => r.isSwingFactor), [sensitivity]);

  // Tornado chart data — sorted by absolute sensitivity index
  const tornadoData = useMemo(() =>
    sensitivity.slice(0, 12).map(r => ({
      role: r.role.length > 18 ? r.role.slice(0, 18) + '…' : r.role,
      sensitivityIndex: r.sensitivityIndex,
      pearsonR: r.pearsonR,
      swing: r.swing,
      color: r.sensitivityIndex > 0.3 ? '#f43f5e' : r.sensitivityIndex > 0.15 ? '#f97316' : '#8b5cf6',
    })),
  [sensitivity]);

  // Radar data for top roles
  const radarData = useMemo(() =>
    sensitivity.slice(0, 7).map(r => ({
      role: r.role.length > 14 ? r.role.slice(0, 14) + '…' : r.role,
      sensitivity: Math.round(r.sensitivityIndex * 100),
      influence: r.avgInfluence * 10, // scale to 0-100
      frequency: r.appearanceRate,
    })),
  [sensitivity]);

  if (simulations.length < 2) {
    return (
      <Card className="p-12 text-center">
        <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Need 2+ completed simulations</p>
        <p className="text-slate-400 text-sm mt-1">Run more simulations to compute sensitivity indices</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Explanation banner */}
      <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-100 rounded-lg">
        <Info className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-violet-700 space-y-0.5">
          <p className="font-semibold">How sensitivity is computed</p>
          <p>Sensitivity Index = |Pearson r(influence, weighted tension)| × appearance frequency. Swing = avg tensions with role − avg without. Higher = more impact on outcomes.</p>
        </div>
      </div>

      {/* Swing Factor Badges */}
      {swingFactors.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Swing Factors
          </h3>
          <p className="text-xs text-slate-400 mb-4">Roles whose presence or absence most significantly changes tension outcomes</p>
          <div className="flex flex-wrap gap-2">
            {swingFactors.map(r => (
              <div key={r.roleId} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white shadow-sm">
                <div className={`w-2 h-2 rounded-full ${r.swing > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                <span className="text-xs font-medium text-slate-700">{r.role}</span>
                <Badge variant="outline" className={`text-xs ${r.swing > 0 ? 'text-rose-600 border-rose-200' : 'text-emerald-600 border-emerald-200'}`}>
                  {r.swing > 0 ? '+' : ''}{r.swing} tension swing
                </Badge>
                <Badge variant="outline" className="text-xs text-violet-600 border-violet-200">
                  r={r.pearsonR}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tornado Chart */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" /> Sensitivity Tornado Chart
        </h3>
        <p className="text-xs text-slate-400 mb-4">Roles ranked by sensitivity index — highest impact at the top</p>
        {tornadoData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, tornadoData.length * 32)}>
            <BarChart data={tornadoData} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 'dataMax']} tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(2)} label={{ value: 'Sensitivity Index', position: 'insideBottom', offset: -4, fontSize: 10 }} />
              <YAxis dataKey="role" type="category" tick={{ fontSize: 9 }} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sensitivityIndex" name="Sensitivity Index" radius={[0, 4, 4, 0]}>
                {tornadoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-400 text-sm">Not enough role variation</div>
        )}
      </Card>

      {/* Role Sensitivity Table */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" /> Detailed Sensitivity Metrics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 text-slate-500 font-medium">Role</th>
                <th className="text-right py-2 pr-4 text-slate-500 font-medium">Sensitivity</th>
                <th className="text-right py-2 pr-4 text-slate-500 font-medium">Pearson r</th>
                <th className="text-right py-2 pr-4 text-slate-500 font-medium">Tension Swing</th>
                <th className="text-right py-2 pr-4 text-slate-500 font-medium">Avg Influence</th>
                <th className="text-right py-2 text-slate-500 font-medium">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((r, i) => (
                <tr
                  key={r.roleId}
                  className={`border-b border-slate-100 transition-colors cursor-default ${hoveredRole === r.roleId ? 'bg-violet-50' : 'hover:bg-slate-50'}`}
                  onMouseEnter={() => setHoveredRole(r.roleId)}
                  onMouseLeave={() => setHoveredRole(null)}
                >
                  <td className="py-2 pr-4 font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      {r.isSwingFactor && <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                      {r.role}
                    </div>
                  </td>
                  <td className="text-right py-2 pr-4">
                    <span className={`font-mono font-semibold ${r.sensitivityIndex > 0.3 ? 'text-rose-600' : r.sensitivityIndex > 0.15 ? 'text-orange-500' : 'text-slate-600'}`}>
                      {r.sensitivityIndex.toFixed(3)}
                    </span>
                  </td>
                  <td className="text-right py-2 pr-4">
                    <span className={`font-mono ${r.pearsonR > 0 ? 'text-rose-500' : r.pearsonR < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {r.pearsonR > 0 ? '+' : ''}{r.pearsonR.toFixed(3)}
                    </span>
                  </td>
                  <td className="text-right py-2 pr-4">
                    <span className={`font-mono ${r.swing > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {r.swing > 0 ? '+' : ''}{r.swing}
                    </span>
                  </td>
                  <td className="text-right py-2 pr-4 font-mono text-slate-600">{r.avgInfluence}</td>
                  <td className="text-right py-2">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-400 rounded-full" style={{ width: `${r.appearanceRate}%` }} />
                      </div>
                      <span className="text-slate-500 w-8">{r.appearanceRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Spider/Radar */}
      {radarData.length >= 3 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-500" /> Sensitivity Spider Diagram
          </h3>
          <p className="text-xs text-slate-400 mb-4">Multi-dimensional view: sensitivity, influence, and frequency for top roles</p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={110}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="role" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="Sensitivity (×100)" dataKey="sensitivity" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
              <Radar name="Avg Influence (×10)" dataKey="influence" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
              <Radar name="Frequency %" dataKey="frequency" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Conflict Heatmap */}
      {conflictMatrix.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Role-Pair Conflict Heatmap
          </h3>
          <p className="text-xs text-slate-400 mb-4">Frequency × severity-weighted conflict intensity between role pairs</p>
          <div className="space-y-1.5">
            {conflictMatrix.map((item, i) => {
              const maxScore = conflictMatrix[0]?.weightedScore || 1;
              const intensity = item.weightedScore / maxScore;
              const color = intensity > 0.7 ? 'bg-rose-500' : intensity > 0.4 ? 'bg-orange-400' : 'bg-amber-300';
              return (
                <div key={i} className="relative rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-rose-50" style={{ opacity: intensity * 0.6 }} />
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <span className="text-xs font-medium text-slate-700">
                      {item.pair.map(r => r.replace(/_/g, ' ')).join(' ↔ ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <Badge variant="outline" className="text-xs">{item.count}x conflicts</Badge>
                      <Badge className="text-xs bg-rose-100 text-rose-700 border-rose-200">
                        score {item.weightedScore}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}