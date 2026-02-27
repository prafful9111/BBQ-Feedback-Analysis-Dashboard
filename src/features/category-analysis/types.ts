import { DEFAULT_PAGE_SIZE } from '@/shared/constants/feedback';
import { createLastDaysRange, type DateMode, type QuickDateKey } from '@/shared/lib/date-filter';
import type { IssueCategory } from '@/shared/types/feedback';
import type { Rating } from '@/shared/types/feedback';

export const CATEGORY_SLUG_TO_NAME: Record<string, IssueCategory> = {
  'food-beverage': 'Food & Beverage',
  'ambience-hygiene': 'Ambience & Hygiene',
  'booking-billing': 'Booking & Billing',
  'staff-service': 'Staff & Service',
};

export type CategoryRatingFilter = 'All Ratings' | Rating;

export interface CategoryPageFilterState {
  search: string;
  region: string;
  outletId: string;
  rating: CategoryRatingFilter;
  dateMode: DateMode;
  dateFrom: string;
  dateTo: string;
  quickDateKey: QuickDateKey;
  page: number;
  pageSize: number;
}

export const createDefaultCategoryFilters = (): CategoryPageFilterState => {
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
