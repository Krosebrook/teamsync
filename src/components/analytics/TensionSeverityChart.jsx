import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-slate-900">{data.severity}</p>
        <p className="text-sm font-semibold" style={{ color: data.fill }}>
          Count: {data.count}
        </p>
        <p className="text-sm text-slate-600">
          Frequency: {((data.count / (payload[0].payload.__totalCount || 100)) * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

const TensionSeverityChart = ({ data, chartType, onDataPointClick }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-slate-500">
        No tension data available
      </div>
    );
  }

  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  const dataWithTotal = data.map(d => ({ ...d, __totalCount: totalCount }));

  const handleClick = (data) => {
    onDataPointClick(data);
  };

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dataWithTotal}
            dataKey="count"
            nameKey="severity"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ severity, percent }) => `${severity}: ${(percent * 100).toFixed(0)}%`}
            onClick={(entry) => handleClick(entry)}
          >
            {dataWithTotal.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={dataWithTotal} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <defs>
          {dataWithTotal.map((d, idx) => (
            <linearGradient key={`gradient-${idx}`} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={d.fill} stopOpacity={0.8} />
              <stop offset="100%" stopColor={d.fill} stopOpacity={0.6} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="severity"
          tick={{ fontSize: 12, fill: '#64748b' }}
          stroke="#cbd5e1"
        />
        <YAxis
          label={{ value: 'Tension Count', angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12, fill: '#64748b' }}
          stroke="#cbd5e1"
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="count"
          fill="#8884d8"
          onClick={(data) => handleClick(data.payload)}
          isAnimationActive={true}
          radius={[8, 8, 0, 0]}
        >
          {dataWithTotal.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TensionSeverityChart;