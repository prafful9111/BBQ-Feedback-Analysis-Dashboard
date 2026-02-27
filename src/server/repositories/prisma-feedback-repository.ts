import type {
  DashboardOverview,
  FeedbackListResponse,
  FeedbackRecord,
} from '@/shared/types/feedback';

import { DummyFeedbackRepository } from '@/server/repositories/dummy-feedback-repository';
import type { FeedbackRepository } from '@/server/repositories/feedback-repository';
import type { DashboardQuery, FeedbackListQuery } from '@/server/validation/feedback-query';

/**
 * Prisma repository placeholder.
 *
 * TODO(SUPABASE): Replace fallback calls with Prisma queries once the Supabase
 * connection string is configured and migrations are applied.
 */
export class PrismaFeedbackRepository implements FeedbackRepository {
  private readonly fallbackRepository = new DummyFeedbackRepository();

  async listFeedback(query: FeedbackListQuery): Promise<FeedbackListResponse> {
    return this.fallbackRepository.listFeedback(query);
  }

  async getFeedbackById(feedbackId: string): Promise<FeedbackRecord | null> {
    return this.fallbackRepository.getFeedbackById(feedbackId);
  }

  async getDashboardOverview(query: DashboardQuery): Promise<DashboardOverview> {
    return this.fallbackRepository.getDashboardOverview(query);
  }
}
