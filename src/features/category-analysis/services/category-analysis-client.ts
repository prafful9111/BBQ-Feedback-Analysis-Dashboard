import { listAllFeedbackByQuery, listFeedbackByQuery } from '@/shared/services/feedback-api-client';
import type { FeedbackListItem, FeedbackListResponse, IssueCategory } from '@/shared/types/feedback';

import type { CategoryPageFilterState } from '@/features/category-analysis/types';

export const getCategoryRecords = async (
  category: IssueCategory,
  filters: CategoryPageFilterState,
): Promise<FeedbackListResponse> => {
  return listFeedbackByQuery({
    page: filters.page,
    pageSize: filters.pageSize,
    category,
    search: filters.search || undefined,
    region: filters.region !== 'All Regions' ? filters.region : undefined,
    outletId: filters.outletId !== 'All Outlets' ? filters.outletId : undefined,
    ratings: filters.rating !== 'All Ratings' ? filters.rating : undefined,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
};

export const exportCategoryRecords = async (
  category: IssueCategory,
  filters: CategoryPageFilterState,
): Promise<FeedbackListItem[]> => {
  return listAllFeedbackByQuery({
    category,
    search: filters.search || undefined,
    region: filters.region !== 'All Regions' ? filters.region : undefined,
    outletId: filters.outletId !== 'All Outlets' ? filters.outletId : undefined,
    ratings: filters.rating !== 'All Ratings' ? [filters.rating] : undefined,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
};
