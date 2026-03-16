import React, { useMemo } from 'react';
import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Treemap
} from 'recharts';
import { Users } from 'lucide-react';

const COLORS = [
  '#8b5cf6','#3b82f6','#06b6d4','#f43f5e','#f59e0b',
  '#10b981','#ec4899','#6366f1','#84cc16','#f97316',
  '#a78bfa','#60a5fa','#34d399','#fb923c','#f472b6',
];

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

export default function InfluenceDistribution({ simulations }) {
  // Per-role aggregated stats
  const roleStats = useMemo(() => {
    const map = {};
    simulations.forEach(s => {
      const totalInfluence = s.selected_roles?.reduce((a, r) => a + (r.influence || 5), 0) || 1;
      s.selected_roles?.forEach(r => {
        if (!map[r.role]) map[r.role] = {
          role: r.role,
          label: r.role.replace(/_/g, ' '),
          totalInfluence: 0,
          count: 0,
          appearances: 0,
          shareSum: 0,
          maxInfluence: 0,
        };
        const influence = r.influence || 5;
        map[r.role].totalInfluence += influence;
        map[r.role].count++;
        map[r.role].appearances++;
        map[r.role].shareSum += influence / totalInfluence;
        map[r.role].maxInfluence = Math.max(map[r.role].maxInfluence, influence);
      });
    });
    return Object.values(map)
      .map(r => ({
        ...r,
        avgInfluence: parseFloat((r.totalInfluence / r.count).toFixed(1)),
        avgShare: parseFloat(((r.shareSum / r.appearances) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.avgShare - a.avgShare);
  }, [simulations]);

  // Distribution of influence buckets across all roles
  const bucketData = useMemo(() => {
    const buckets = { '1-3 Low': 0, '4-6 Medium': 0, '7-8 High': 0, '9-10 Critical': 0 };
    simulations.forEach(s => {
      s.selected_roles?.forEach(r => {
        const inf = r.influence || 5;
        if (inf <= 3) buckets['1-3 Low']++;
        else if (inf <= 6) buckets['4-6 Medium']++;
        else if (inf <= 8) buckets['7-8 High']++;
        else buckets['9-10 Critical']++;
      });
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [simulations]);

  const bucketColors = { '1-3 Low': '#94a3b8', '4-6 Medium': '#60a5fa', '7-8 High': '#8b5cf6', '9-10 Critical': '#f43f5e' };

  // Treemap data — total influence budget by role
  const treemapData = useMemo(() => ({
    name: 'roles',
    children: roleStats.slice(0, 15).map((r, i) => ({
      name: r.label,
      size: r.totalInfluence,
      color: COLORS[i % COLORS.length],
    })),
  }), [roleStats]);

  const TreemapContent = ({ root, depth, x, y, width, height, index, name }) => {
    if (width < 20 || height < 20) return null;
    return (
      <g>
        <rect x={x} y={y} width={width} height={height}
          style={{ fill: COLORS[index % COLORS.length], stroke: '#fff', strokeWidth: 2, opacity: 0.9 }} />
        {width > 50 && height > 25 && (
          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: Math.min(11, width / 6), fill: '#fff', fontWeight: 600, pointerEvents: 'none' }}>
            {name.length > width / 7 ? name.slice(0, Math.floor(width / 7)) + '…' : name}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top bar — avg influence by role */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" /> Average Influence by Role
        </h3>
        <p className="text-xs text-slate-400 mb-4">Mean influence score (1–10) assigned to each role across all simulations</p>
        {roleStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, roleStats.slice(0, 14).length * 26)}>
            <BarChart data={roleStats.slice(0, 14)} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 9 }} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgInfluence" name="Avg Influence" radius={[0, 4, 4, 0]}>
                {roleStats.slice(0, 14).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data</div>
        )}
      </Card>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Influence bucket distribution */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Influence Level Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">How often each influence tier is used across all role assignments</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={bucketData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {bucketData.map(entry => <Cell key={entry.name} fill={bucketColors[entry.name]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {bucketData.map(b => (
              <Badge key={b.name} variant="outline" className="text-xs gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: bucketColors[b.name] }} />
                {b.name}: {b.value}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Avg share of total influence per role */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Role Share of Influence Budget</h3>
          <p className="text-xs text-slate-400 mb-4">Average % of total influence each role holds within simulations it appears in</p>
          {roleStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={roleStats.slice(0, 10)} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgShare" name="Avg Share %" radius={[4, 4, 0, 0]}>
                  {roleStats.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data</div>
          )}
        </Card>
      </div>

      {/* Treemap */}
      {roleStats.length >= 3 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Total Influence Budget by Role</h3>
          <p className="text-xs text-slate-400 mb-4">Cumulative influence across all simulations — bigger = more total weight</p>
          <ResponsiveContainer width="100%" height={220}>
            <Treemap data={treemapData.children} dataKey="size" content={<TreemapContent />} />
          </ResponsiveContainer>
        </Card>
      )}

      {/* Table */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Role Influence Summary Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-4 text-slate-500 font-medium">Role</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Appearances</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Avg Influence</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Max Influence</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Avg Share</th>
              </tr>
            </thead>
            <tbody>
              {roleStats.map((r, i) => (
                <tr key={r.role} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 pr-4 font-medium text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                    {r.label}
                  </td>
                  <td className="text-right py-2 px-3 text-slate-600">{r.appearances}</td>
                  <td className="text-right py-2 px-3 text-slate-600">{r.avgInfluence}</td>
                  <td className="text-right py-2 px-3 text-slate-600">{r.maxInfluence}</td>
                  <td className="text-right py-2 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${r.avgShare}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-slate-600">{r.avgShare}%</span>
                    </div>
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