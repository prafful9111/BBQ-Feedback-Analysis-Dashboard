import { fetchJson } from '@/shared/lib/http';
import { listAllFeedbackByQuery, listFeedbackByQuery } from '@/shared/services/feedback-api-client';
import type { FeedbackListItem, FeedbackListResponse, FeedbackRecord } from '@/shared/types/feedback';

import type { FeedbackFilterState } from '@/features/feedback-management/types';

const dateToIsoStart = (date: string) => {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
};

const dateToIsoEnd = (date: string) => {
  return new Date(`${date}T23:59:59.999Z`).toISOString();
};

export const getFeedbackList = async (filters: FeedbackFilterState): Promise<FeedbackListResponse> => {
  return listFeedbackByQuery({
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    region: filters.region || undefined,
    manager: filters.manager || undefined,
    outletId: filters.outletId || undefined,
    ratings: filters.ratings.length > 0 ? filters.ratings.join(',') : undefined,
    category: filters.category,
    severity: filters.severity,
    dateFrom: filters.dateFrom ? dateToIsoStart(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? dateToIsoEnd(filters.dateTo) : undefined,
  });
};

export const exportFeedbackList = async (filters: FeedbackFilterState): Promise<FeedbackListItem[]> => {
  return listAllFeedbackByQuery({
    search: filters.search || undefined,
    region: filters.region || undefined,
    manager: filters.manager || undefined,
    outletId: filters.outletId || undefined,
    ratings: filters.ratings.length > 0 ? filters.ratings : undefined,
    category: filters.category,
    severity: filters.severity,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
};

export const getFeedbackById = async (feedbackId: string): Promise<FeedbackRecord> => {
  return fetchJson<FeedbackRecord>(`/api/feedback/${feedbackId}`);
};
