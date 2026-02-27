import type { IssueCategory, IssueSeverity, Rating } from '@/shared/types/feedback';

export interface FeedbackFilterState {
  page: number;
  pageSize: number;
  search: string;
  region: string;
  manager: string;
  outletId: string;
  ratings: Rating[];
  category?: IssueCategory;
  severity?: IssueSeverity;
  dateFrom: string;
  dateTo: string;
}

export const createDefaultFeedbackFilters = (): FeedbackFilterState => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 30);

  return {
    page: 1,
    pageSize: 20,
    search: '',
    region: '',
    manager: '',
    outletId: '',
    ratings: [],
    category: undefined,
    severity: undefined,
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: now.toISOString().slice(0, 10),
  };
};
