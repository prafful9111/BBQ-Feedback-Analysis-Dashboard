'use client';

import { useMemo, useState } from 'react';

import { AlertsBanner } from '@/features/dashboard-overview/components/alerts-banner';
import { ChartWrapper } from '@/features/dashboard-overview/components/chart-wrapper';
import { DashboardFilters } from '@/features/dashboard-overview/components/dashboard-filters';
import { IssuesBreakdownChart } from '@/features/dashboard-overview/components/issues-breakdown-chart';
import { KpiGrid } from '@/features/dashboard-overview/components/kpi-grid';
import { PerformanceMatrixTable } from '@/features/dashboard-overview/components/performance-matrix-table';
import {
  createDefaultDashboardFilters,
  type DashboardFilterState,
} from '@/features/dashboard-overview/types';
import { useDashboardOverview } from '@/features/dashboard-overview/hooks/use-dashboard-overview';
import { RatingDistributionChart } from '@/shared/components/charts/rating-distribution-chart';
import { EmptyState } from '@/shared/components/data-display/empty-state';
import { LoadingGrid } from '@/shared/components/data-display/loading-grid';
import { OUTLET_OPTIONS } from '@/shared/constants/outlets';
import type { DashboardFilterOptions } from '@/shared/types/feedback';

const fallbackFilterOptions: DashboardFilterOptions = {
  regions: Array.from(new Set(OUTLET_OPTIONS.map((outlet) => outlet.region))).sort(),
  managers: Array.from(new Set(OUTLET_OPTIONS.map((outlet) => outlet.manager))).sort(),
  outlets: OUTLET_OPTIONS.map((outlet) => ({
    id: outlet.id,
    name: outlet.name,
    region: outlet.region,
    manager: outlet.manager,
  })),
};

export const DashboardOverviewPage = () => {
  const [filters, setFilters] = useState<DashboardFilterState>(createDefaultDashboardFilters());

  const query = useDashboardOverview(filters);

  const filterOptions = useMemo(() => {
    return query.data?.filterOptions ?? fallbackFilterOptions;
  }, [query.data]);

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <DashboardFilters value={filters} options={filterOptions} onChange={setFilters} />
        <LoadingGrid />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <DashboardFilters value={filters} options={filterOptions} onChange={setFilters} />
        <EmptyState
          title="Unable to load dashboard"
          description="The dashboard service failed to load. Please retry or verify API connectivity."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertsBanner alerts={query.data.latestAlerts} />

      <DashboardFilters value={filters} options={query.data.filterOptions} onChange={setFilters} />

      <KpiGrid dashboard={query.data} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ChartWrapper title="Customer Experience Rating">
            <RatingDistributionChart data={query.data.ratingDistribution} />
          </ChartWrapper>
        </div>

        <div className="lg:col-span-2">
          <ChartWrapper title="Issue Ticket Distribution">
            <IssuesBreakdownChart data={query.data.issueTicketDistribution} />
          </ChartWrapper>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Performance Matrix</h3>
          <p className="text-xs font-medium text-slate-500">
            Aggregated view for {query.data.performanceMatrix.length} outlets
          </p>
        </div>

        <PerformanceMatrixTable data={query.data.performanceMatrix} />
      </div>
    </div>
  );
};
