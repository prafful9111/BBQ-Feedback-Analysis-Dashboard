import { listAllFeedbackByQuery, listFeedbackByQuery } from '@/shared/services/feedback-api-client';
import type { FeedbackListItem, FeedbackListResponse } from '@/shared/types/feedback';

import type { CallsPageFilterState } from '@/features/call-logs/types';

export const getCallsPageRecords = async (
  filters: CallsPageFilterState,
): Promise<FeedbackListResponse> => {
  return listFeedbackByQuery({
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    region: filters.region !== 'All Regions' ? filters.region : undefined,
    outletId: filters.outletId !== 'All Outlets' ? filters.outletId : undefined,
    ratings: filters.rating !== 'All Ratings' ? filters.rating : undefined,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
};

export const exportCallsRecords = async (
  filters: CallsPageFilterState,
): Promise<FeedbackListItem[]> => {
  return listAllFeedbackByQuery({
    search: filters.search || undefined,
    region: filters.region !== 'All Regions' ? filters.region : undefined,
    outletId: filters.outletId !== 'All Outlets' ? filters.outletId : undefined,
    ratings: filters.rating !== 'All Ratings' ? [filters.rating] : undefined,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
};
