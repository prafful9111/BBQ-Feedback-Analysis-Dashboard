'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ISSUE_CATEGORIES } from '@/shared/constants/feedback';
import { cn } from '@/shared/lib/cn';
import type { IssueCategory, IssueTicketDistribution } from '@/shared/types/feedback';

type BreakdownView = 'category' | 'subcategory' | 'attribute';
type SeverityKey = 'all' | 'high' | 'medium' | 'low';

interface IssuesBreakdownChartProps {
  data: IssueTicketDistribution;
}

const severityMeta: Record<SeverityKey, { label: string; color: string }> = {
  all: { label: 'All', color: '#ea580c' },
  high: { label: 'High', color: '#dc2626' },
  medium: { label: 'Medium', color: '#f59e0b' },
  low: { label: 'Low', color: '#64748b' },
};

export const IssuesBreakdownChart = ({ data }: IssuesBreakdownChartProps) => {
  const [view, setView] = useState<BreakdownView>('category');
  const [activeCategory, setActiveCategory] = useState<IssueCategory>('Food & Beverage');
  const [selectedSeverities, setSelectedSeverities] = useState<SeverityKey[]>(['all']);
  const [showAll, setShowAll] = useState(false);

  const activeSeverityKeys = useMemo(() => {
    if (selectedSeverities.includes('all')) {
      return ['all'] as SeverityKey[];
    }

    return selectedSeverities;
  }, [selectedSeverities]);

  const chartData = useMemo(() => {
    let source: any[] = [];
    if (view === 'category') {
      source = data.category || [];
    } else if (view === 'subcategory') {
      source = data.subcategory?.[activeCategory] || [];
    } else {
      source = data.attribute || [];
      if (!showAll) {
        source = source.slice(0, 15);
      }
    }

    return source.map((point) => ({
      label: point.label,
      all: point.counts.all,
      high: point.counts.high,
      medium: point.counts.medium,
      low: point.counts.low,
    }));
  }, [activeCategory, data, view, showAll]);

  const scrollableHeight = useMemo(() => {
    // Base height for category/subcategory and top 15
    if (view !== 'attribute' || !showAll) return 340;
    // For "show all" attributes, provide 30px per bar + some padding
    return Math.max(340, chartData.length * 30 + 40);
  }, [view, showAll, chartData.length]);

  const toggleSeverity = (severity: SeverityKey) => {
    if (severity === 'all') {
      setSelectedSeverities(['all']);
      return;
    }

    setSelectedSeverities((previous) => {
      const withoutAll = previous.filter((item) => item !== 'all');

      if (withoutAll.includes(severity)) {
        const next = withoutAll.filter((item) => item !== severity);
        return next.length > 0 ? next : ['all'];
      }

      return [...withoutAll, severity];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setView('category')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-bold transition-all',
              view === 'category' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            Category
          </button>
          <button
            type="button"
            onClick={() => setView('subcategory')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-bold transition-all',
              view === 'subcategory' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            Sub-category
          </button>
          <button
            type="button"
            onClick={() => setView('attribute')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-bold transition-all',
              view === 'attribute' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            Attribute
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Issue Severity</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'high', 'medium', 'low'] as SeverityKey[]).map((severity) => (
              <button
                key={severity}
                type="button"
                onClick={() => toggleSeverity(severity)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-[10px] font-bold transition-all',
                  selectedSeverities.includes(severity)
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                )}
              >
                {severityMeta[severity].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'subcategory' ? (
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
      ) : null}

      {view === 'attribute' && data.attribute && data.attribute.length > 15 ? (
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium text-slate-500">
            {showAll ? `Showing all ${data.attribute.length} attributes` : 'Showing top 15 attributes'}
          </p>
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] font-bold uppercase tracking-wider text-orange-600 hover:text-orange-700"
          >
            {showAll ? 'Show Top 15' : 'Show All'}
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "h-[340px] w-full transition-all duration-300 ease-in-out",
          view === 'attribute' && showAll ? "overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-2" : "overflow-hidden"
        )}
      >
        <div style={{ height: scrollableHeight, minHeight: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 28, left: 12, bottom: 8 }}
              barCategoryGap={view === 'attribute' && showAll ? 6 : 14}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} hide={view === 'attribute' && showAll} />
              <YAxis
                type="category"
                dataKey="label"
                width={view === 'subcategory' ? 160 : view === 'attribute' ? 180 : 120}
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  borderRadius: '0.75rem',
                  borderColor: '#e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '10px', paddingBottom: '10px' }}
                formatter={(value: string) =>
                  severityMeta[value as SeverityKey]?.label ?? value
                }
              />

              {activeSeverityKeys.map((severityKey) => (
                <Bar
                  key={severityKey}
                  dataKey={severityKey}
                  name={severityKey}
                  fill={severityMeta[severityKey].color}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={view === 'attribute' && showAll ? 12 : 18}
                >
                  <LabelList
                    dataKey={severityKey}
                    position="right"
                    fill="#475569"
                    fontSize={view === 'attribute' && showAll ? 9 : 10}
                    fontWeight={600}
                    offset={8}
                  />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
