import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-slate-900">{payload[0].payload.date}</p>
        <p className="text-sm text-blue-600">
          Success Rate: <span className="font-semibold">{payload[0].payload.completion}%</span>
        </p>
        <p className="text-sm text-slate-600">
          Simulations: {payload[0].payload.successful}/{payload[0].payload.total}
        </p>
      </div>
    );
  }
  return null;
};

const SuccessRateChart = ({ data, chartType, onDataPointClick }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-slate-500">
        No data available
      </div>
    );
  }

  const handleClick = (data) => {
    onDataPointClick(data);
  };

  const Chart = chartType === 'area' ? AreaChart : LineChart;
  const DataComponent = chartType === 'area' ? Area : Line;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <Chart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#64748b' }}
          stroke="#cbd5e1"
        />
        <YAxis
          label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12, fill: '#64748b' }}
          stroke="#cbd5e1"
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <DataComponent
          type="monotone"
          dataKey="completion"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#colorCompletion)"
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{
            fill: '#1e40af',
            r: 6,
            onClick: (data) => handleClick(data)
          }}
          isAnimationActive={true}
          name="Success Rate (%)"
        />
      </Chart>
    </ResponsiveContainer>
  );
};

export default SuccessRateChart;