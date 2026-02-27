export type QuickDateKey =
  | 'today'
  | 'yesterday'
  | 'upto_this_week'
  | 'last_week'
  | 'last_month'
  | 'custom';

export type DateMode = 'single' | 'range';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const toDateInputValue = (date: Date): string => {
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
  key: Exclude<QuickDateKey, 'custom'>,
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

export const createLastDaysRange = (days: number, baseDate = new Date()): { dateFrom: string; dateTo: string } => {
  const now = new Date(baseDate);
  const from = new Date(now);
  from.setDate(now.getDate() - Math.max(0, days - 1));

  return {
    dateFrom: toDateInputValue(from),
    dateTo: toDateInputValue(now),
  };
};

const normalizeIsoDate = (date: string): string | undefined => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
};

export const toIsoDateStart = (date: string | undefined): string | undefined => {
  if (!date) {
    return undefined;
  }

  if (DATE_ONLY_REGEX.test(date)) {
    return new Date(`${date}T00:00:00.000Z`).toISOString();
  }

  return normalizeIsoDate(date);
};

export const toIsoDateEnd = (date: string | undefined): string | undefined => {
  if (!date) {
    return undefined;
  }

  if (DATE_ONLY_REGEX.test(date)) {
    return new Date(`${date}T23:59:59.999Z`).toISOString();
  }

  return normalizeIsoDate(date);
};
