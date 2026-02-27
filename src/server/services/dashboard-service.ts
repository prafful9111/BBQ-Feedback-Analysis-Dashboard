import { feedbackService } from '@/server/services/feedback-service';
import type { DashboardQuery } from '@/server/validation/feedback-query';

export const dashboardService = {
  getOverview: async (query: DashboardQuery) => {
    return feedbackService.getDashboardOverview(query);
  },
};
