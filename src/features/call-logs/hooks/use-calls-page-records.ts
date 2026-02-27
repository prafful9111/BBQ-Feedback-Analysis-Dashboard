import { useQuery } from '@tanstack/react-query';

import { getCallsPageRecords } from '@/features/call-logs/services/call-logs-client';
import type { CallsPageFilterState } from '@/features/call-logs/types';

export const useCallsPageRecords = (filters: CallsPageFilterState) => {
  return useQuery({
    queryKey: ['calls-page-records', filters],
    queryFn: () => getCallsPageRecords(filters),
    placeholderData: (previousData) => previousData,
  });
};
