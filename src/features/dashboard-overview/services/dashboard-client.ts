import type { DashboardOverview } from '@/shared/types/feedback';
import { fetchJson } from '@/shared/lib/http';
import { buildQueryString } from '@/shared/lib/query';

import type { DashboardFilterState } from '@/features/dashboard-overview/types';

const toIsoStart = (date: string): string => {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
};

const toIsoEnd = (date: string): string => {
  return new Date(`${date}T23:59:59.999Z`).toISOString();
};

export const getDashboardOverview = async (filters: DashboardFilterState): Promise<DashboardOverview> => {
  const queryString = buildQueryString({
    region: filters.region !== 'All Regions' ? filters.region : undefined,
    manager: filters.manager !== 'All Managers' ? filters.manager : undefined,
    outletId: filters.outletId !== 'All Outlets' ? filters.outletId : undefined,
    dateFrom: toIsoStart(filters.dateFrom),
    dateTo: toIsoEnd(filters.dateTo),
  });

  return fetchJson<DashboardOverview>(`/api/dashboard?${queryString}`);
};
