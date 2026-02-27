import { useQuery } from '@tanstack/react-query';

import { getFeedbackList } from '@/features/feedback-management/services/feedback-client';
import type { FeedbackFilterState } from '@/features/feedback-management/types';

export const useFeedbackList = (filters: FeedbackFilterState) => {
  return useQuery({
    queryKey: ['feedback-list', filters],
    queryFn: () => getFeedbackList(filters),
    placeholderData: (previousData) => previousData,
  });
};
