'use client';

import { Search } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select } from '@/shared/components/ui/select';
import {
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  RATINGS,
  DEFAULT_PAGE_SIZE,
} from '@/shared/constants/feedback';
import { OUTLET_OPTIONS } from '@/shared/constants/outlets';
import type { Rating } from '@/shared/types/feedback';

import type { FeedbackFilterState } from '@/features/feedback-management/types';

interface FeedbackFiltersProps {
  value: FeedbackFilterState;
  onChange: (nextValue: FeedbackFilterState) => void;
  onReset: () => void;
}

const outletOptions = [
  { value: '', label: 'All Outlets' },
  ...OUTLET_OPTIONS.map((outlet) => ({ value: outlet.id, label: outlet.name })),
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  ...ISSUE_CATEGORIES.map((category) => ({ value: category, label: category })),
];

const severityOptions = [
  { value: '', label: 'All Severities' },
  ...ISSUE_SEVERITIES.map((severity) => ({ value: severity, label: severity })),
];

const pageSizeOptions = [
  { value: String(DEFAULT_PAGE_SIZE), label: '20 / page' },
  { value: '50', label: '50 / page' },
  { value: '100', label: '100 / page' },
];

export const FeedbackFilters = ({ value, onChange, onReset }: FeedbackFiltersProps) => {
  const toggleRating = (rating: Rating) => {
    const alreadySelected = value.ratings.includes(rating);

    const nextRatings = alreadySelected
      ? value.ratings.filter((item) => item !== rating)
      : [...value.ratings, rating];

    onChange({
      ...value,
      page: 1,
      ratings: nextRatings,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value.search}
              onChange={(event) => onChange({ ...value, page: 1, search: event.target.value })}
              placeholder="Booking ID, outlet, city, summary"
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Outlet</label>
          <Select
            options={outletOptions}
            value={value.outletId}
            onChange={(event) => onChange({ ...value, page: 1, outletId: event.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
          <Select
            options={categoryOptions}
            value={value.category ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                page: 1,
                category: event.target.value ? (event.target.value as FeedbackFilterState['category']) : undefined,
              })
            }
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Severity</label>
          <Select
            options={severityOptions}
            value={value.severity ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                page: 1,
                severity: event.target.value ? (event.target.value as FeedbackFilterState['severity']) : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Date From</label>
          <input
            type="date"
            value={value.dateFrom}
            onChange={(event) => onChange({ ...value, page: 1, dateFrom: event.target.value })}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Date To</label>
          <input
            type="date"
            value={value.dateTo}
            onChange={(event) => onChange({ ...value, page: 1, dateTo: event.target.value })}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Page Size</label>
          <Select
            options={pageSizeOptions}
            value={String(value.pageSize)}
            onChange={(event) =>
              onChange({
                ...value,
                page: 1,
                pageSize: Number(event.target.value),
              })
            }
          />
        </div>

        <div className="md:col-span-1 lg:col-span-3 lg:flex lg:items-end lg:justify-end">
          <Button variant="outline" onClick={onReset}>
            Reset Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {RATINGS.map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => toggleRating(rating)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              value.ratings.includes(rating)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
};
