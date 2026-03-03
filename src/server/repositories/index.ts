import { PrismaFeedbackRepository } from '@/server/repositories/prisma-feedback-repository';
import type { FeedbackRepository } from '@/server/repositories/feedback-repository';

export const feedbackRepository: FeedbackRepository = new PrismaFeedbackRepository();
