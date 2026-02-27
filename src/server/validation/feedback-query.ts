import { z } from 'zod';

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/shared/constants/feedback';
import { issueCategorySchema, issueSeveritySchema, ratingSchema } from '@/shared/types/feedback';

const isoDateString = z
  .string()
  .datetime()
  .optional()
  .nullable()
  .transform((value) => value ?? undefined);

export const feedbackListQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce
      .number()
      .int()
      .positive()
      .max(MAX_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
    search: z.string().trim().min(1).optional(),
    region: z.string().trim().min(1).optional(),
    manager: z.string().trim().min(1).optional(),
    outletId: z.string().trim().min(1).optional(),
    ratings: z.array(ratingSchema).default([]),
    category: issueCategorySchema.optional(),
    severity: issueSeveritySchema.optional(),
    dateFrom: isoDateString,
    dateTo: isoDateString,
  })
  .refine(
    (query) => {
      if (!query.dateFrom || !query.dateTo) {
        return true;
      }

      return new Date(query.dateFrom).getTime() <= new Date(query.dateTo).getTime();
    },
    {
      message: 'dateFrom must be before or equal to dateTo',
      path: ['dateFrom'],
    },
  );

export type FeedbackListQuery = z.infer<typeof feedbackListQuerySchema>;

export const dashboardQuerySchema = z
  .object({
    region: z.string().trim().min(1).optional(),
    manager: z.string().trim().min(1).optional(),
    outletId: z.string().trim().min(1).optional(),
    ratings: z.array(ratingSchema).default([]),
    dateFrom: isoDateString,
    dateTo: isoDateString,
  })
  .refine(
    (query) => {
      if (!query.dateFrom || !query.dateTo) {
        return true;
      }

      return new Date(query.dateFrom).getTime() <= new Date(query.dateTo).getTime();
    },
    {
      message: 'dateFrom must be before or equal to dateTo',
      path: ['dateFrom'],
    },
  );

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
