import { format, parseISO } from 'date-fns';

export const formatDate = (isoDate: string, formatString = 'dd MMM yyyy') => {
  return format(parseISO(isoDate), formatString);
};

export const formatCompactNumber = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatPercent = (value: number, total: number) => {
  if (total === 0) {
    return '0%';
  }

  return `${((value / total) * 100).toFixed(1)}%`;
};
