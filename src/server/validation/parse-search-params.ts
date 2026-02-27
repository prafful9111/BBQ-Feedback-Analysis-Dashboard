import { ZodError } from 'zod';

import { parseCommaSeparatedParam } from '@/shared/lib/query';
import {
  dashboardQuerySchema,
  feedbackListQuerySchema,
  type DashboardQuery,
  type FeedbackListQuery,
} from '@/server/validation/feedback-query';

export const parseFeedbackListQuery = (searchParams: URLSearchParams): FeedbackListQuery => {
  try {
    return feedbackListQuerySchema.parse({
      page: searchParams.get('page') ?? 1,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      region: searchParams.get('region') ?? undefined,
      manager: searchParams.get('manager') ?? undefined,
      outletId: searchParams.get('outletId') ?? undefined,
      ratings: parseCommaSeparatedParam(searchParams.get('ratings')),
      category: searchParams.get('category') ?? undefined,
      severity: searchParams.get('severity') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(error.issues.map((issue) => issue.message).join(', '));
    }

    throw error;
  }
};

export const parseDashboardQuery = (searchParams: URLSearchParams): DashboardQuery => {
  try {
    return dashboardQuerySchema.parse({
      region: searchParams.get('region') ?? undefined,
      manager: searchParams.get('manager') ?? undefined,
      outletId: searchParams.get('outletId') ?? undefined,
      ratings: parseCommaSeparatedParam(searchParams.get('ratings')),
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(error.issues.map((issue) => issue.message).join(', '));
    }

    throw error;
  }
};
