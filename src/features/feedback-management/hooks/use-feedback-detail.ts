import { useQuery } from '@tanstack/react-query';

import { getFeedbackById } from '@/features/feedback-management/services/feedback-client';

export const useFeedbackDetail = (feedbackId: string | null, isOpen: boolean) => {
  return useQuery({
    queryKey: ['feedback-detail', feedbackId],
    queryFn: () => getFeedbackById(feedbackId as string),
    enabled: Boolean(feedbackId && isOpen),
  });
};
