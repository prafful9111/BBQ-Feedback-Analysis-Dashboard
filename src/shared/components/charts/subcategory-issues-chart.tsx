'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ISSUE_CATEGORIES } from '@/shared/constants/feedback';
import { cn } from '@/shared/lib/cn';
import type { SubcategoryDistribution } from '@/shared/types/feedback';

interface SubcategoryIssuesChartProps {
  data: SubcategoryDistribution;
}

export const SubcategoryIssuesChart = ({ data }: SubcategoryIssuesChartProps) => {
  const [activeCategory, setActiveCategory] = useState<(typeof ISSUE_CATEGORIES)[number]>('Food & Beverage');

  const activeData = useMemo(() => {
    return data[activeCategory] ?? [];
  }, [activeCategory, data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {ISSUE_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-[10px] font-bold transition-all',
              activeCategory === category
                ? 'border-orange-600 bg-orange-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activeData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" fill="#fb923c" radius={[6, 6, 0, 0]} barSize={32}>
              <LabelList
                dataKey="value"
                position="top"
                offset={8}
                style={{ fontSize: '10px', fontWeight: 700, fill: '#fb923c' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
