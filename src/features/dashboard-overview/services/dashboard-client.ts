import type { DashboardOverview } from '@/shared/types/feedback';
import { toIsoDateEnd, toIsoDateStart } from '@/shared/lib/date-filter';
import { fetchJson } from '@/shared/lib/http';
import { buildQueryString } from '@/shared/lib/query';

import type { DashboardFilterState } from '@/features/dashboard-overview/types';

export const getDashboardOverview = async (filters: DashboardFilterState): Promise<DashboardOverview> => {
  const queryString = buildQueryString({
    region: filters.region !== 'All Regions' ? filters.region : undefined,
    manager: filters.manager !== 'All Managers' ? filters.manager : undefined,
    outletId: filters.outletId !== 'All Outlets' ? filters.outletId : undefined,
    dateFrom: toIsoDateStart(filters.dateFrom),
    dateTo: toIsoDateEnd(filters.dateTo),
  });

  return fetchJson<DashboardOverview>(`/api/dashboard?${queryString}`);
};
