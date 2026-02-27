'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DistributionPoint } from '@/shared/types/feedback';

interface CategoryIssuesChartProps {
  data: DistributionPoint[];
}

interface TwoLineTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: string;
  };
}

const splitLabel = (label: string): [string, string] => {
  if (label === 'Food & Beverage') {
    return ['Food &', 'Beverage'];
  }

  if (label === 'Ambience & Hygiene') {
    return ['Ambience &', 'Hygiene'];
  }

  if (label === 'Booking & Billing') {
    return ['Booking &', 'Billing'];
  }

  if (label === 'Staff & Service') {
    return ['Staff &', 'Service'];
  }

  const words = label.split(' ');
  if (words.length <= 1) {
    return [label, ''];
  }

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
};

const TwoLineCategoryTick = ({ x, y, payload }: TwoLineTickProps) => {
  if (typeof x !== 'number' || typeof y !== 'number' || !payload) {
    return null;
  }

  const [firstLine, secondLine] = splitLabel(payload.value);

  return (
    <text x={x} y={y} textAnchor="middle" fill="#475569" fontSize={11}>
      <tspan x={x} dy={0}>
        {firstLine}
      </tspan>
      {secondLine ? (
        <tspan x={x} dy={12}>
          {secondLine}
        </tspan>
      ) : null}
    </text>
  );
};

export const CategoryIssuesChart = ({ data }: CategoryIssuesChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 12, right: 20, left: 10, bottom: 28 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="label"
          interval={0}
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          tick={<TwoLineCategoryTick />}
          height={42}
        />
        <YAxis allowDecimals={false} width={32} axisLine={false} tickLine={false} fontSize={11} />
        <Tooltip contentStyle={{ borderRadius: '0.5rem', borderColor: '#e2e8f0' }} />
        <Bar dataKey="value" fill="#ea580c" radius={[6, 6, 0, 0]}>
          <LabelList dataKey="value" position="top" fill="#334155" fontSize={11} fontWeight={700} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
