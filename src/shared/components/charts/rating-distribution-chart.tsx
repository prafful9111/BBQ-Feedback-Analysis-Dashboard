'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { DistributionPoint } from '@/shared/types/feedback';

const COLORS = {
  Excellent: '#16a34a',
  Good: '#2563eb',
  Average: '#d97706',
  Poor: '#dc2626',
  'N/A': '#64748b',
};

interface RatingDistributionChartProps {
  data: DistributionPoint[];
}

export const RatingDistributionChart = ({ data }: RatingDistributionChartProps) => {
  const total = data.reduce((accumulator, point) => accumulator + point.value, 0);
  const chartData = data.map((point) => ({
    ...point,
    fill: COLORS[point.label as keyof typeof COLORS] ?? '#64748b',
    percentage: total > 0 ? (point.value / total) * 100 : 0,
  }));

  return (
    <div className="h-full min-h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 2 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, _name, payload) => {
              return [
                `${value.toLocaleString('en-IN')} (${(payload.payload.percentage as number).toFixed(1)}%)`,
                payload.payload.label,
              ];
            }}
            contentStyle={{ borderRadius: '0.5rem', borderColor: '#e2e8f0' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {chartData.map((point) => (
              <Cell key={point.label} fill={point.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
