import type { LucideIcon } from 'lucide-react';
import { AlertCircle, ArrowDownRight, ArrowUpRight, Clock, Star, TrendingUp, Users } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import type { DashboardOverview } from '@/shared/types/feedback';

interface KpiGridProps {
  dashboard: DashboardOverview;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  comingSoon?: boolean;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = 'text-slate-900',
  comingSoon = false,
}: StatCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      {comingSoon ? (
        <div className="absolute right-2 top-2 rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-tighter text-slate-400">
          Soon
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-lg bg-slate-50 p-1.5 transition-colors group-hover:bg-slate-100">
          <Icon className={cn('h-4 w-4', color)} />
        </div>

        {!comingSoon && trend ? (
          <div
            className={cn(
              'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
              trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
            )}
          >
            {trendUp ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
            {trend}
          </div>
        ) : null}
      </div>

      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
      <h4 className={cn('text-xl font-bold tracking-tight', comingSoon ? 'text-slate-300' : 'text-slate-900')}>
        {value}
      </h4>
    </div>
  );
};

export const KpiGrid = ({ dashboard }: KpiGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <StatCard title="Total Calls" value={dashboard.kpis.totalCalls.toLocaleString('en-IN')} icon={Users} trend="+8.2%" trendUp />
      <StatCard
        title="Avg Rating"
        value={`${dashboard.kpis.avgRatingScore.toFixed(1)}/4.0`}
        icon={Star}
        trend="+0.1"
        trendUp
        color="text-yellow-500"
      />
      <StatCard
        title="High Severity"
        value={dashboard.kpis.highSeverityIssues.toLocaleString('en-IN')}
        icon={AlertCircle}
        trend="+12%"
        trendUp={false}
        color="text-red-600"
      />
      <StatCard
        title="Medium Severity"
        value={dashboard.kpis.mediumSeverityIssues.toLocaleString('en-IN')}
        icon={AlertCircle}
        trend="-4%"
        trendUp
        color="text-orange-500"
      />
      <StatCard title="Issues Resolved" value="--" icon={TrendingUp} comingSoon color="text-emerald-500" />
      <StatCard title="Issues Pending" value="--" icon={Clock} comingSoon color="text-slate-400" />
    </div>
  );
};
