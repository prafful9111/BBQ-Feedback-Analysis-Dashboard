'use client';

import { Calendar, Download, MapPin, Search, Star } from 'lucide-react';

import { OUTLET_OPTIONS } from '@/shared/constants/outlets';
import {
  resolveQuickDateRange,
  type DateMode,
  type QuickDateKey,
} from '@/shared/lib/date-filter';
import { cn } from '@/shared/lib/cn';
import type { Rating } from '@/shared/types/feedback';

const ratingOptions: Array<'All Ratings' | Rating> = ['All Ratings', 'Excellent', 'Good', 'Average', 'Poor', 'N/A'];

const quickDateOptions: Array<{ key: Exclude<QuickDateKey, 'custom'>; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'upto_this_week', label: 'Up until this week' },
  { key: 'last_week', label: 'Last week' },
  { key: 'last_month', label: 'Last month' },
];

interface FeedbackTableFiltersValue {
  search: string;
  region: string;
  outletId: string;
  rating: 'All Ratings' | Rating;
  dateMode: DateMode;
  dateFrom: string;
  dateTo: string;
  quickDateKey: QuickDateKey;
  page: number;
}

interface FeedbackTableFiltersProps<T extends FeedbackTableFiltersValue> {
  value: T;
  onChange: (nextValue: T) => void;
  onDownloadCsv: () => void;
  isLoading?: boolean;
  isExporting?: boolean;
  searchPlaceholder?: string;
}

export const FeedbackTableFilters = <T extends FeedbackTableFiltersValue>({
  value,
  onChange,
  onDownloadCsv,
  isLoading = false,
  isExporting = false,
  searchPlaceholder = 'Search by booking ID, outlet, or summary...',
}: FeedbackTableFiltersProps<T>) => {
  const regionOptions = ['All Regions', ...Array.from(new Set(OUTLET_OPTIONS.map((outlet) => outlet.region))).sort()];

  const outletOptions = [
    { id: 'All Outlets', name: 'All Outlets' },
    ...OUTLET_OPTIONS.filter((outlet) => value.region === 'All Regions' || outlet.region === value.region).map(
      (outlet) => ({
        id: outlet.id,
        name: outlet.name,
      }),
    ),
  ];

  const applyPatch = (patch: Partial<T>) => {
    onChange({
      ...value,
      ...patch,
      page: 1,
    });
  };

  const applyQuickRange = (quickDateKey: Exclude<QuickDateKey, 'custom'>) => {
    const range = resolveQuickDateRange(quickDateKey);
    applyPatch({
      dateMode: range.dateFrom === range.dateTo ? 'single' : 'range',
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      quickDateKey,
    } as Partial<T>);
  };

  const applyDateChange = (field: 'dateFrom' | 'dateTo', nextValue: string) => {
    const nextState = {
      ...value,
      [field]: nextValue,
      quickDateKey: 'custom' as const,
      page: 1,
    };

    if (nextState.dateMode === 'single') {
      nextState.dateFrom = nextValue;
      nextState.dateTo = nextValue;
      onChange(nextState);
      return;
    }

    if (nextState.dateFrom > nextState.dateTo) {
      if (field === 'dateFrom') {
        nextState.dateTo = nextState.dateFrom;
      } else {
        nextState.dateFrom = nextState.dateTo;
      }
    }

    onChange(nextState);
  };

  const applyDateMode = (mode: DateMode) => {
    if (mode === value.dateMode) {
      return;
    }

    if (mode === 'single') {
      applyPatch({
        dateMode: 'single',
        dateTo: value.dateFrom,
        quickDateKey: 'custom',
      } as Partial<T>);
      return;
    }

    applyPatch({
      dateMode: 'range',
      dateTo: value.dateTo >= value.dateFrom ? value.dateTo : value.dateFrom,
      quickDateKey: 'custom',
    } as Partial<T>);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={value.search}
            onChange={(event) => applyPatch({ search: event.target.value } as Partial<T>)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        <button
          type="button"
          onClick={onDownloadCsv}
          disabled={isLoading || isExporting}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4 text-slate-400" />
          {isExporting ? 'Preparing CSV...' : 'Download CSV'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Region</span>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={value.region}
              onChange={(event) =>
                applyPatch({
                  region: event.target.value,
                  outletId: 'All Outlets',
                } as Partial<T>)
              }
              className="h-10 w-full appearance-none rounded-lg bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none ring-2 ring-transparent transition-all focus:ring-orange-500/20"
            >
              {regionOptions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Outlet</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={value.outletId}
              onChange={(event) => applyPatch({ outletId: event.target.value } as Partial<T>)}
              className="h-10 w-full appearance-none rounded-lg bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none ring-2 ring-transparent transition-all focus:ring-orange-500/20"
            >
              {outletOptions.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rating</span>
          <div className="relative">
            <Star className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={value.rating}
              onChange={(event) => applyPatch({ rating: event.target.value as T['rating'] } as Partial<T>)}
              className="h-10 w-full appearance-none rounded-lg bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none ring-2 ring-transparent transition-all focus:ring-orange-500/20"
            >
              {ratingOptions.map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Date Mode
          </label>
          <div className="inline-flex h-10 w-full items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => applyDateMode('single')}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-all',
                value.dateMode === 'single' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500',
              )}
            >
              Single Date
            </button>
            <button
              type="button"
              onClick={() => applyDateMode('range')}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-all',
                value.dateMode === 'range' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500',
              )}
            >
              Date Range
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {value.dateMode === 'single' ? 'Date' : 'Date From'}
          </label>
          <input
            type="date"
            value={value.dateFrom}
            onChange={(event) => applyDateChange('dateFrom', event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-orange-300 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Date To
          </label>
          <input
            type="date"
            value={value.dateTo}
            disabled={value.dateMode === 'single'}
            onChange={(event) => applyDateChange('dateTo', event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:border-orange-300 focus:bg-white"
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Date Filters</p>
        <div className="flex flex-wrap gap-2">
          {quickDateOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => applyQuickRange(option.key)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                value.quickDateKey === option.key
                  ? 'border-orange-600 bg-orange-50 text-orange-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
              )}
            >
              {option.label}
            </button>
          ))}
          <div className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {value.dateMode === 'single' ? value.dateFrom : `${value.dateFrom} to ${value.dateTo}`}
          </div>
        </div>
      </div>
    </div>
  );
};
