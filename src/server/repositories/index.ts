import { DummyFeedbackRepository } from '@/server/repositories/dummy-feedback-repository';
import { PrismaFeedbackRepository } from '@/server/repositories/prisma-feedback-repository';
import type { FeedbackRepository } from '@/server/repositories/feedback-repository';

const dataSource = process.env.DATA_SOURCE ?? 'dummy';

/**
 * Repository selector.
 *
 * `DATA_SOURCE=dummy` (default): uses generated development data.
 * `DATA_SOURCE=prisma`: routes through Prisma repository.
 */
const createFeedbackRepository = (): FeedbackRepository => {
  if (dataSource === 'prisma') {
    return new PrismaFeedbackRepository();
  }

  return new DummyFeedbackRepository();
};

export const feedbackRepository = createFeedbackRepository();
