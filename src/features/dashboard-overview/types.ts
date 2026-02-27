import {
  createLastDaysRange,
  resolveQuickDateRange,
  type DateMode,
  type QuickDateKey,
} from '@/shared/lib/date-filter';

export type DashboardQuickDateKey = QuickDateKey;

export interface DashboardFilterState {
  region: string;
  manager: string;
  outletId: string;
  dateMode: DateMode;
  dateFrom: string;
  dateTo: string;
  quickDateKey: DashboardQuickDateKey;
}

export const createDefaultDashboardFilters = (): DashboardFilterState => {
  const range = createLastDaysRange(7);

  return {
    region: 'All Regions',
    manager: 'All Managers',
    outletId: 'All Outlets',
    dateMode: 'range',
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    quickDateKey: 'custom',
  };
};

export { resolveQuickDateRange };
