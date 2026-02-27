import { MAX_PAGE_SIZE } from '@/shared/constants/feedback';
import { toIsoDateEnd, toIsoDateStart } from '@/shared/lib/date-filter';
import { fetchJson } from '@/shared/lib/http';
import { buildQueryString } from '@/shared/lib/query';
import type { FeedbackListItem, FeedbackListResponse, IssueCategory, IssueSeverity, Rating } from '@/shared/types/feedback';

export interface FeedbackApiQuery {
  page: number;
  pageSize: number;
  search?: string;
  region?: string;
  manager?: string;
  outletId?: string;
  ratings?: string;
  category?: IssueCategory;
  severity?: IssueSeverity;
  dateFrom?: string;
  dateTo?: string;
}

export interface FeedbackApiExportQuery {
  search?: string;
  region?: string;
  manager?: string;
  outletId?: string;
  ratings?: Rating[];
  category?: IssueCategory;
  severity?: IssueSeverity;
  dateFrom?: string;
  dateTo?: string;
}

export const listFeedbackByQuery = async (query: FeedbackApiQuery): Promise<FeedbackListResponse> => {
  const queryString = buildQueryString({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    region: query.region,
    manager: query.manager,
    outletId: query.outletId,
    ratings: query.ratings,
    category: query.category,
    severity: query.severity,
    dateFrom: toIsoDateStart(query.dateFrom),
    dateTo: toIsoDateEnd(query.dateTo),
  });

  return fetchJson<FeedbackListResponse>(`/api/feedback?${queryString}`);
};

export const listAllFeedbackByQuery = async (
  query: FeedbackApiExportQuery,
): Promise<FeedbackListItem[]> => {
  const baseQuery: FeedbackApiQuery = {
    page: 1,
    pageSize: MAX_PAGE_SIZE,
    search: query.search,
    region: query.region,
    manager: query.manager,
    outletId: query.outletId,
    ratings: query.ratings && query.ratings.length > 0 ? query.ratings.join(',') : undefined,
    category: query.category,
    severity: query.severity,
    dateFrom: toIsoDateStart(query.dateFrom),
    dateTo: toIsoDateEnd(query.dateTo),
  };

  const firstPage = await listFeedbackByQuery(baseQuery);
  const records = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const response = await listFeedbackByQuery({
      ...baseQuery,
      page,
    });

    records.push(...response.items);
  }

  return records;
};
