export type DashboardQuickDateKey =
  | 'today'
  | 'yesterday'
  | 'upto_this_week'
  | 'last_week'
  | 'last_month'
  | 'custom';

export interface DashboardFilterState {
  region: string;
  manager: string;
  outletId: string;
  dateMode: 'single' | 'range';
  dateFrom: string;
  dateTo: string;
  quickDateKey: DashboardQuickDateKey;
}

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfWeekMonday = (date: Date): Date => {
  const copy = new Date(date);
  const dayIndex = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - dayIndex);
  return copy;
};

export const resolveQuickDateRange = (
  key: Exclude<DashboardQuickDateKey, 'custom'>,
  baseDate = new Date(),
): { dateFrom: string; dateTo: string } => {
  const now = new Date(baseDate);

  if (key === 'today') {
    const today = toDateInputValue(now);
    return { dateFrom: today, dateTo: today };
  }

  if (key === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const day = toDateInputValue(yesterday);
    return { dateFrom: day, dateTo: day };
  }

  if (key === 'upto_this_week') {
    const weekStart = startOfWeekMonday(now);
    return {
      dateFrom: toDateInputValue(weekStart),
      dateTo: toDateInputValue(now),
    };
  }

  if (key === 'last_week') {
    const thisWeekStart = startOfWeekMonday(now);
    const previousWeekStart = new Date(thisWeekStart);
    previousWeekStart.setDate(thisWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(thisWeekStart);
    previousWeekEnd.setDate(thisWeekStart.getDate() - 1);

    return {
      dateFrom: toDateInputValue(previousWeekStart),
      dateTo: toDateInputValue(previousWeekEnd),
    };
  }

  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(firstDayCurrentMonth);
  firstDayLastMonth.setMonth(firstDayCurrentMonth.getMonth() - 1);
  const lastDayLastMonth = new Date(firstDayCurrentMonth);
  lastDayLastMonth.setDate(0);

  return {
    dateFrom: toDateInputValue(firstDayLastMonth),
    dateTo: toDateInputValue(lastDayLastMonth),
  };
};

export const createDefaultDashboardFilters = (): DashboardFilterState => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);

  return {
    region: 'All Regions',
    manager: 'All Managers',
    outletId: 'All Outlets',
    dateMode: 'range',
    dateFrom: toDateInputValue(sevenDaysAgo),
    dateTo: toDateInputValue(now),
    quickDateKey: 'custom',
  };
};
