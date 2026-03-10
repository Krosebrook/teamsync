import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4">
        <p className="text-sm font-medium text-slate-900 mb-3">{data.name}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {Math.round(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PersonaEngagementChart = ({ data, onDataPointClick }) => {
  const [visibleMetrics, setVisibleMetrics] = useState({
    interactions: true,
    avgResponseTime: true,
    completionRate: true,
  });

  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-80 text-slate-500">
          No persona engagement data available
        </div>
      </div>
    );
  }

  const handleLegendClick = (dataKey) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  const handleClick = (data) => {
    onDataPointClick(data);
  };

  return (
    <div className="space-y-4">
      {/* Metric Toggle */}
      <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-1 rounded transition-colors">
          <input
            type="checkbox"
            checked={visibleMetrics.interactions}
            onChange={() => handleLegendClick('interactions')}
            className="w-4 h-4 rounded border-slate-300"
          />
          <span className="text-sm font-medium text-slate-700">Interactions</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-1 rounded transition-colors">
          <input
            type="checkbox"
            checked={visibleMetrics.avgResponseTime}
            onChange={() => handleLegendClick('avgResponseTime')}
            className="w-4 h-4 rounded border-slate-300"
          />
          <span className="text-sm font-medium text-slate-700">Avg Response Time (ms)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-1 rounded transition-colors">
          <input
            type="checkbox"
            checked={visibleMetrics.completionRate}
            onChange={() => handleLegendClick('completionRate')}
            className="w-4 h-4 rounded border-slate-300"
          />
          <span className="text-sm font-medium text-slate-700">Completion Rate (%)</span>
        </label>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#64748b' }}
            stroke="#cbd5e1"
          />
          <YAxis
            yAxisId="left"
            label={{ value: 'Interactions / Completion %', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12, fill: '#64748b' }}
            stroke="#cbd5e1"
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'Response Time (ms)', angle: 90, position: 'insideRight' }}
            tick={{ fontSize: 12, fill: '#64748b' }}
            stroke="#cbd5e1"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            onClick={(e) => {
              if (e.dataKey) handleLegendClick(e.dataKey);
            }}
          />

          {visibleMetrics.interactions && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="interactions"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              onClick={(data) => handleClick(data)}
              isAnimationActive={true}
              name="Interactions (count)"
            />
          )}
          {visibleMetrics.avgResponseTime && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgResponseTime"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
              onClick={(data) => handleClick(data)}
              isAnimationActive={true}
              name="Avg Response Time (ms)"
            />
          )}
          {visibleMetrics.completionRate && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="completionRate"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              onClick={(data) => handleClick(data)}
              isAnimationActive={true}
              name="Completion Rate (%)"
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Data Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-700">Persona</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-700">Interactions</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-700">Avg Response (ms)</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-700">Completion %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onDataPointClick(row)}
              >
                <td className="px-4 py-2 font-medium text-slate-900">{row.name}</td>
                <td className="px-4 py-2 text-right text-slate-600">{Math.round(row.interactions)}</td>
                <td className="px-4 py-2 text-right text-slate-600">{row.avgResponseTime}</td>
                <td className="px-4 py-2 text-right text-slate-600">
                  <span className={`font-medium ${row.completionRate >= 80 ? 'text-green-600' : row.completionRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {row.completionRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersonaEngagementChart;