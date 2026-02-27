import { feedbackRepository } from '@/server/repositories';
import type { DashboardQuery, FeedbackListQuery } from '@/server/validation/feedback-query';

export const feedbackService = {
  listFeedback: async (query: FeedbackListQuery) => {
    return feedbackRepository.listFeedback(query);
  },

  getFeedbackById: async (feedbackId: string) => {
    return feedbackRepository.getFeedbackById(feedbackId);
  },

  getDashboardOverview: async (query: DashboardQuery) => {
    return feedbackRepository.getDashboardOverview(query);
  },
};
