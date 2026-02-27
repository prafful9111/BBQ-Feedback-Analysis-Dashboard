import { useQuery } from '@tanstack/react-query';

import { getDashboardOverview } from '@/features/dashboard-overview/services/dashboard-client';
import type { DashboardFilterState } from '@/features/dashboard-overview/types';

export const useDashboardOverview = (filters: DashboardFilterState) => {
  return useQuery({
    queryKey: ['dashboard-overview', filters],
    queryFn: () => getDashboardOverview(filters),
  });
};
