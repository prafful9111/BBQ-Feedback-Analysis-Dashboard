'use client';

import type { ComponentType } from 'react';
import { Calendar, MapPin, Search, UserCheck } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import type { DashboardFilterOptions } from '@/shared/types/feedback';

import {
  resolveQuickDateRange,
  type DashboardFilterState,
  type DashboardQuickDateKey,
} from '@/features/dashboard-overview/types';

interface DashboardFiltersProps {
  value: DashboardFilterState;
  options: DashboardFilterOptions;
  onChange: (nextValue: DashboardFilterState) => void;
}

const quickDateOptions: Array<{
  key: Exclude<DashboardQuickDateKey, 'custom'>;
  label: string;
}> = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'upto_this_week', label: 'Up until this week' },
  { key: 'last_week', label: 'Last week' },
  { key: 'last_month', label: 'Last month' },
];

interface FilterOption {
  label: string;
  value: string;
}

interface FilterSelectProps {
  icon: ComponentType<{ className?: string }>;
  value: string;
  options: FilterOption[];
  onChange: (nextValue: string) => void;
}

const FilterSelect = ({ icon: Icon, value, options, onChange }: FilterSelectProps) => {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-orange-300 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export const DashboardFilters = ({ value, options, onChange }: DashboardFiltersProps) => {
  const regionOptions = [
    { label: 'All Regions', value: 'All Regions' },
    ...options.regions.map((region) => ({ label: region, value: region })),
  ];
  const outletNamesById = new Map(options.outlets.map((outlet) => [outlet.id, outlet.name]));

  const selectedRegion = value.region;
  const selectedManager = value.manager;
  const managerOptions = [
    { label: 'All Managers', value: 'All Managers' },
    ...Array.from(
      new Set(
        options.outlets
          .filter((outlet) => selectedRegion === 'All Regions' || outlet.region === selectedRegion)
          .map((outlet) => outlet.manager),
      ),
    )
      .sort()
      .map((manager) => ({ label: manager, value: manager })),
  ];

  const outletOptions: FilterOption[] = [
    { label: 'All Outlets', value: 'All Outlets' },
    ...options.outlets
      .filter((outlet) => selectedRegion === 'All Regions' || outlet.region === selectedRegion)
      .filter((outlet) => selectedManager === 'All Managers' || outlet.manager === selectedManager)
      .map((outlet) => ({ label: outlet.name, value: outlet.id })),
  ];

  const applyQuickRange = (quickDateKey: Exclude<DashboardQuickDateKey, 'custom'>) => {
    const range = resolveQuickDateRange(quickDateKey);
    onChange({
      ...value,
      dateMode: range.dateFrom === range.dateTo ? 'single' : 'range',
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      quickDateKey,
    });
  };

  const applyDateChange = (field: 'dateFrom' | 'dateTo', nextValue: string) => {
    const nextState: DashboardFilterState = {
      ...value,
      [field]: nextValue,
      quickDateKey: 'custom',
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

  const applyDateMode = (mode: 'single' | 'range') => {
    if (mode === value.dateMode) {
      return;
    }

    if (mode === 'single') {
      onChange({
        ...value,
        dateMode: 'single',
        dateTo: value.dateFrom,
        quickDateKey: 'custom',
      });
      return;
    }

    onChange({
      ...value,
      dateMode: 'range',
      dateTo: value.dateTo >= value.dateFrom ? value.dateTo : value.dateFrom,
      quickDateKey: 'custom',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">BBQ Nation Feedback Analysis</h2>
          <p className="text-sm font-medium text-slate-500">
            Comprehensive management dashboard for high-volume outlet analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {value.dateMode === 'single' ? value.dateFrom : `${value.dateFrom} to ${value.dateTo}`}
          </div>
          <Button className="bg-orange-600 text-white hover:bg-orange-700">Generate Report</Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Region
            </label>
            <FilterSelect
              icon={MapPin}
              value={value.region}
              options={regionOptions}
              onChange={(region) => {
                onChange({
                  ...value,
                  region,
                  manager: 'All Managers',
                  outletId: 'All Outlets',
                });
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Manager
            </label>
            <FilterSelect
              icon={UserCheck}
              value={value.manager}
              options={managerOptions}
              onChange={(manager) => {
                onChange({
                  ...value,
                  manager,
                  outletId: 'All Outlets',
                });
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Outlet
            </label>
            <FilterSelect
              icon={Search}
              value={value.outletId}
              options={outletOptions}
              onChange={(outletId) => onChange({ ...value, outletId })}
            />
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
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  value.dateMode === 'single' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Single Date
              </button>
              <button
                type="button"
                onClick={() => applyDateMode('range')}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  value.dateMode === 'range' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500'
                }`}
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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {quickDateOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => applyQuickRange(option.key)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                value.quickDateKey === option.key
                  ? 'border-orange-600 bg-orange-50 text-orange-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          ))}

          <div className="ml-auto text-xs text-slate-500">
            {value.outletId !== 'All Outlets'
              ? `Focused outlet: ${outletNamesById.get(value.outletId) ?? value.outletId}`
              : 'Network-wide view'}
          </div>
        </div>
      </div>
    </div>
  );
};
