import type {
  DashboardOverview,
  FeedbackListResponse,
  FeedbackRecord,
} from '@/shared/types/feedback';

import type { DashboardQuery, FeedbackListQuery } from '@/server/validation/feedback-query';

export interface FeedbackRepository {
  listFeedback(query: FeedbackListQuery): Promise<FeedbackListResponse>;
  getFeedbackById(feedbackId: string): Promise<FeedbackRecord | null>;
  getDashboardOverview(query: DashboardQuery): Promise<DashboardOverview>;
}
