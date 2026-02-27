import { DEFAULT_PAGE_SIZE } from '@/shared/constants/feedback';
import { createLastDaysRange, type DateMode, type QuickDateKey } from '@/shared/lib/date-filter';
import type { Rating } from '@/shared/types/feedback';

export type CallsRatingFilter = 'All Ratings' | Rating;

export interface CallsPageFilterState {
  search: string;
  region: string;
  outletId: string;
  rating: CallsRatingFilter;
  dateMode: DateMode;
  dateFrom: string;
  dateTo: string;
  quickDateKey: QuickDateKey;
  page: number;
  pageSize: number;
}

export const createDefaultCallsFilters = (): CallsPageFilterState => {
  const range = createLastDaysRange(7);

  return {
    search: '',
    region: 'All Regions',
    outletId: 'All Outlets',
    rating: 'All Ratings',
    dateMode: 'range',
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    quickDateKey: 'custom',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };
};
