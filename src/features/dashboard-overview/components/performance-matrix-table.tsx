'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Building2, Download, Info, LayoutGrid, Map as MapIcon, Phone, Search } from 'lucide-react';

import { Pagination } from '@/shared/components/ui/pagination';
import { CSAT_FIELDS } from '@/shared/constants/feedback';
import { cn } from '@/shared/lib/cn';
import { downloadCsv } from '@/shared/lib/csv';
import type { CsatField, CsatMetric, IssueCategory, PerformanceMatrixRow } from '@/shared/types/feedback';

type ColumnGroup = 'basic' | 'ratings' | 'issues' | 'csat_details';
type ViewBy = 'outlet' | 'city' | 'region';
type ValueType = 'number' | 'percent';
type CsatSortKey = `csat_${CsatField}`;

interface PerformanceMatrixTableProps {
  data: PerformanceMatrixRow[];
}

type MatrixRow = PerformanceMatrixRow;

interface CsatAggregateMetric {
  ratingTotal: number;
  callCount: number;
}

interface AggregatedMatrixRow extends Omit<PerformanceMatrixRow, 'avgRatingScore' | 'csatDetails'> {
  avgRatingScoreTotal: number;
  csatDetails: Record<CsatField, CsatAggregateMetric>;
}

type MatrixSortKey =
  | 'name'
  | 'totalCalls'
  | 'avgRatingScore'
  | 'excellentCount'
  | 'goodCount'
  | 'averageCount'
  | 'poorCount'
  | 'naCount'
  | 'highSeverityIssues'
  | 'mediumSeverityIssues'
  | 'lowSeverityIssues'
  | 'specialMentionsCount'
  | 'categoryFoodIssues'
  | 'categoryAmbienceIssues'
  | 'categoryBookingIssues'
  | 'categoryServiceIssues'
  | CsatSortKey;

const columnGroupLabels: Record<ColumnGroup, string> = {
  basic: 'BASIC',
  ratings: 'RATINGS',
  issues: 'ISSUES & MENTIONS',
  csat_details: 'CSAT DETAILS',
};

const categoryKeys: IssueCategory[] = [
  'Food & Beverage',
  'Ambience & Hygiene',
  'Booking & Billing',
  'Staff & Service',
];

const csatColumnConfig: Array<{ field: CsatField; label: string }> = [
  { field: 'ambience_hygiene_overall', label: 'Ambience & Hygiene (Overall)' },
  { field: 'ambience', label: 'Ambience' },
  { field: 'hygiene', label: 'Hygiene' },
  { field: 'food_and_beverages_overall', label: 'Food & Beverages (Overall)' },
  { field: 'beverages', label: 'Beverages' },
  { field: 'buffet_main_course', label: 'Buffet/Main Course' },
  { field: 'starters_and_grills', label: 'Starters & Grills' },
  { field: 'kulfi', label: 'Kulfi' },
  { field: 'booking_and_billing', label: 'Booking & Billing' },
  { field: 'staff_and_service', label: 'Staff & Service' },
];

const ratingGroupClass = 'bg-emerald-50/45';
const issuesGroupClass = 'bg-rose-50/45';
const scorecardGroupClass = 'bg-sky-50/50';

const createEmptyCsatAggregate = (): Record<CsatField, CsatAggregateMetric> => {
  const aggregate = {} as Record<CsatField, CsatAggregateMetric>;

  for (const field of CSAT_FIELDS) {
    aggregate[field] = {
      ratingTotal: 0,
      callCount: 0,
    };
  }

  return aggregate;
};

const toCsatAggregate = (csatDetails: PerformanceMatrixRow['csatDetails']) => {
  const aggregate = createEmptyCsatAggregate();

  for (const field of CSAT_FIELDS) {
    const metric = csatDetails[field];
    aggregate[field] = {
      ratingTotal: metric.rating * metric.callCount,
      callCount: metric.callCount,
    };
  }

  return aggregate;
};

const toCsatDetails = (
  csatAggregate: Record<CsatField, CsatAggregateMetric>,
): PerformanceMatrixRow['csatDetails'] => {
  const details = {} as PerformanceMatrixRow['csatDetails'];

  for (const field of CSAT_FIELDS) {
    const metric = csatAggregate[field];
    details[field] = {
      rating: metric.callCount > 0 ? metric.ratingTotal / metric.callCount : 0,
      callCount: metric.callCount,
    };
  }

  return details;
};

const toCsatSortKey = (field: CsatField): CsatSortKey => `csat_${field}`;

const getCsatFieldFromSortKey = (sortKey: MatrixSortKey): CsatField | null => {
  if (!sortKey.startsWith('csat_')) {
    return null;
  }

  const field = sortKey.replace('csat_', '') as CsatField;
  return CSAT_FIELDS.includes(field) ? field : null;
};

const formatCsatMetric = (metric: CsatMetric) => {
  const callsText = `${metric.callCount.toLocaleString('en-IN')} ${metric.callCount === 1 ? 'Call' : 'Calls'}`;

  if (metric.callCount === 0) {
    return `N/A (${callsText})`;
  }

  return `${metric.rating.toFixed(1)} (${callsText})`;
};

const renderCsatMetric = (metric: CsatMetric) => {
  const countText = metric.callCount.toLocaleString('en-IN');
  const ratingText = metric.callCount === 0 ? 'N/A' : metric.rating.toFixed(1);

  return (
    <div className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-sm font-bold text-slate-800">{ratingText}</span>
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
        (
        <Phone className="h-2.5 w-2.5" />
        {countText}
        )
      </span>
    </div>
  );
};

export const PerformanceMatrixTable = ({ data }: PerformanceMatrixTableProps) => {
  const [viewBy, setViewBy] = useState<ViewBy>('outlet');
  const [visibleGroups, setVisibleGroups] = useState<ColumnGroup[]>([
    'basic',
    'ratings',
    'issues',
    'csat_details',
  ]);
  const [valueType, setValueType] = useState<ValueType>('number');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: MatrixSortKey; direction: 'asc' | 'desc' }>({
    key: 'avgRatingScore',
    direction: 'desc',
  });
  const pageSize = 20;

  const aggregatedData = useMemo<MatrixRow[]>(() => {
    if (viewBy === 'outlet') {
      return data;
    }

    const grouped = new Map<string, AggregatedMatrixRow>();

    for (const row of data) {
      const groupingKey = viewBy === 'city' ? row.city : row.region;
      const existing = grouped.get(groupingKey);

      if (!existing) {
        grouped.set(groupingKey, {
          id: groupingKey,
          name: groupingKey,
          city: viewBy === 'city' ? groupingKey : 'Multiple',
          region: viewBy === 'region' ? groupingKey : row.region,
          manager: 'Multiple',
          totalCalls: row.totalCalls,
          avgRatingScoreTotal: row.avgRatingScore * row.totalCalls,
          excellentCount: row.excellentCount,
          goodCount: row.goodCount,
          averageCount: row.averageCount,
          poorCount: row.poorCount,
          naCount: row.naCount,
          specialMentionsCount: row.specialMentionsCount,
          highSeverityIssues: row.highSeverityIssues,
          mediumSeverityIssues: row.mediumSeverityIssues,
          lowSeverityIssues: row.lowSeverityIssues,
          categoryIssues: {
            'Food & Beverage': row.categoryIssues['Food & Beverage'],
            'Ambience & Hygiene': row.categoryIssues['Ambience & Hygiene'],
            'Booking & Billing': row.categoryIssues['Booking & Billing'],
            'Staff & Service': row.categoryIssues['Staff & Service'],
          },
          csatDetails: toCsatAggregate(row.csatDetails),
        });

        continue;
      }

      existing.totalCalls += row.totalCalls;
      existing.avgRatingScoreTotal += row.avgRatingScore * row.totalCalls;
      existing.excellentCount += row.excellentCount;
      existing.goodCount += row.goodCount;
      existing.averageCount += row.averageCount;
      existing.poorCount += row.poorCount;
      existing.naCount += row.naCount;
      existing.specialMentionsCount += row.specialMentionsCount;
      existing.highSeverityIssues += row.highSeverityIssues;
      existing.mediumSeverityIssues += row.mediumSeverityIssues;
      existing.lowSeverityIssues += row.lowSeverityIssues;

      for (const category of categoryKeys) {
        existing.categoryIssues[category] += row.categoryIssues[category];
      }

      for (const field of CSAT_FIELDS) {
        existing.csatDetails[field].ratingTotal += row.csatDetails[field].rating * row.csatDetails[field].callCount;
        existing.csatDetails[field].callCount += row.csatDetails[field].callCount;
      }
    }

    return Array.from(grouped.values()).map((row) => {
      const { avgRatingScoreTotal, ...rest } = row;

      return {
        ...rest,
        avgRatingScore: row.totalCalls > 0 ? avgRatingScoreTotal / row.totalCalls : 0,
        csatDetails: toCsatDetails(row.csatDetails),
      };
    });
  }, [data, viewBy]);

  const sortedData = useMemo(() => {
    const getSortValue = (row: MatrixRow, key: MatrixSortKey): number | string => {
      if (key === 'categoryFoodIssues') {
        return row.categoryIssues['Food & Beverage'];
      }

      if (key === 'categoryAmbienceIssues') {
        return row.categoryIssues['Ambience & Hygiene'];
      }

      if (key === 'categoryBookingIssues') {
        return row.categoryIssues['Booking & Billing'];
      }

      if (key === 'categoryServiceIssues') {
        return row.categoryIssues['Staff & Service'];
      }

      const csatField = getCsatFieldFromSortKey(key);
      if (csatField) {
        return row.csatDetails[csatField].rating;
      }

      if (key === 'name') {
        return row.name;
      }

      if (key === 'totalCalls') {
        return row.totalCalls;
      }

      if (key === 'avgRatingScore') {
        return row.avgRatingScore;
      }

      if (key === 'excellentCount') {
        return row.excellentCount;
      }

      if (key === 'goodCount') {
        return row.goodCount;
      }

      if (key === 'averageCount') {
        return row.averageCount;
      }

      if (key === 'poorCount') {
        return row.poorCount;
      }

      if (key === 'naCount') {
        return row.naCount;
      }

      if (key === 'highSeverityIssues') {
        return row.highSeverityIssues;
      }

      if (key === 'mediumSeverityIssues') {
        return row.mediumSeverityIssues;
      }

      if (key === 'lowSeverityIssues') {
        return row.lowSeverityIssues;
      }

      return row.specialMentionsCount;
    };

    return [...aggregatedData].sort((left, right) => {
      const leftValue = getSortValue(left, sortConfig.key);
      const rightValue = getSortValue(right, sortConfig.key);

      if (typeof leftValue === 'string' && typeof rightValue === 'string') {
        const comparison = leftValue.localeCompare(rightValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      const leftNumber = typeof leftValue === 'number' ? leftValue : 0;
      const rightNumber = typeof rightValue === 'number' ? rightValue : 0;
      return sortConfig.direction === 'asc' ? leftNumber - rightNumber : rightNumber - leftNumber;
    });
  }, [aggregatedData, sortConfig]);

  const filteredData = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return sortedData;
    }

    return sortedData.filter((row) => {
      return (
        row.name.toLowerCase().includes(normalizedQuery) ||
        row.city.toLowerCase().includes(normalizedQuery) ||
        row.region.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [searchQuery, sortedData]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig, viewBy, valueType, visibleGroups]);

  const totalRecords = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSort = (key: MatrixSortKey) => {
    setSortConfig((previous) => ({
      key,
      direction: previous.key === key && previous.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const toggleGroup = (group: ColumnGroup) => {
    setVisibleGroups((previous) => {
      if (previous.includes(group)) {
        return previous.filter((value) => value !== group);
      }

      return [...previous, group];
    });
  };

  const formatValue = (value: number, total: number) => {
    if (valueType === 'percent') {
      return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%';
    }

    return value.toLocaleString('en-IN');
  };

  const handleDownloadCsv = () => {
    const shouldDownloadAll =
      totalPages <= 1 ||
      window.confirm(
        `This will download all ${totalRecords.toLocaleString()} filtered rows across ${totalPages} pages. Continue?`,
      );

    if (!shouldDownloadAll) {
      return;
    }

    downloadCsv(
      'performance-matrix.csv',
      [
        viewBy.toUpperCase(),
        'City',
        'Region',
        'Total Calls',
        'Avg Experience Score',
        'Excellent',
        'Good',
        'Average',
        'Poor',
        'N/A',
        'High Severity Issues',
        'Medium Severity Issues',
        'Low Severity Issues',
        'Special Mentions',
        'Food & Beverage Issues',
        'Ambience & Hygiene Issues',
        'Booking & Billing Issues',
        'Staff & Service Issues',
        ...csatColumnConfig.map((column) => `${column.label} Rating (Calls)`),
      ],
      filteredData.map((row) => [
        row.name,
        row.city,
        row.region,
        row.totalCalls,
        row.avgRatingScore.toFixed(2),
        row.excellentCount,
        row.goodCount,
        row.averageCount,
        row.poorCount,
        row.naCount,
        row.highSeverityIssues,
        row.mediumSeverityIssues,
        row.lowSeverityIssues,
        row.specialMentionsCount,
        row.categoryIssues['Food & Beverage'],
        row.categoryIssues['Ambience & Hygiene'],
        row.categoryIssues['Booking & Billing'],
        row.categoryIssues['Staff & Service'],
        ...csatColumnConfig.map((column) => formatCsatMetric(row.csatDetails[column.field])),
      ]),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Group View By</span>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {(['outlet', 'city', 'region'] as ViewBy[]).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setViewBy(view)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-all',
                    viewBy === view ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {view === 'outlet' ? <Building2 className="h-3 w-3" /> : null}
                  {view === 'city' ? <MapIcon className="h-3 w-3" /> : null}
                  {view === 'region' ? <LayoutGrid className="h-3 w-3" /> : null}
                  {view.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Visible Columns</span>
            <div className="flex flex-wrap gap-2">
              {(['basic', 'ratings', 'issues', 'csat_details'] as ColumnGroup[]).map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all',
                    visibleGroups.includes(group)
                      ? 'border-orange-200 bg-orange-50 text-orange-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                  )}
                >
                  {columnGroupLabels[group]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data Display</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setValueType('number')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-bold transition-all',
                  valueType === 'number' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
                )}
              >
                Numbers
              </button>
              <button
                type="button"
                onClick={() => setValueType('percent')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-bold transition-all',
                  valueType === 'percent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
                )}
              >
                Percentages
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Download CSV
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={`Search ${viewBy} / city / region`}
          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      {valueType === 'percent' ? (
        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-medium text-blue-700">
          <Info className="h-3.5 w-3.5" />
          Note: Percentages are only applicable for Customer Experience Rating and use{' '}
          <strong>Total Feedback Calls</strong> as denominator.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2500px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="sticky left-0 z-30 border-r border-slate-200 bg-slate-100 px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[6px_0_12px_-8px_rgba(15,23,42,0.5)]">
                  <button type="button" className="flex items-center gap-2" onClick={() => handleSort('name')}>
                    {viewBy.toUpperCase()} <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>

                {visibleGroups.includes('basic') ? (
                  <>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <button
                        type="button"
                        className="flex items-center gap-2"
                        onClick={() => handleSort('totalCalls')}
                      >
                        Calls <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <button
                        type="button"
                        className="flex items-center gap-2"
                        onClick={() => handleSort('avgRatingScore')}
                      >
                        Exp. Score <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  </>
                ) : null}

                {visibleGroups.includes('ratings') ? (
                  <>
                    <th
                      className={cn(
                        'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-emerald-600',
                        ratingGroupClass,
                      )}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={() => handleSort('excellentCount')}
                      >
                        Excellent <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th
                      className={cn(
                        'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-blue-600',
                        ratingGroupClass,
                      )}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={() => handleSort('goodCount')}
                      >
                        Good <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th
                      className={cn(
                        'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-amber-600',
                        ratingGroupClass,
                      )}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={() => handleSort('averageCount')}
                      >
                        Average <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th
                      className={cn(
                        'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-red-600',
                        ratingGroupClass,
                      )}
                    >
                      <button type="button" className="flex items-center gap-1" onClick={() => handleSort('poorCount')}>
                        Poor <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th
                      className={cn(
                        'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400',
                        ratingGroupClass,
                      )}
                    >
                      <button type="button" className="flex items-center gap-1" onClick={() => handleSort('naCount')}>
                        N/A <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  </>
                ) : null}

                {visibleGroups.includes('issues') ? (
                  <>
                    <th
                      className={cn(
                        'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-red-700',
                        issuesGroupClass,
                      )}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={() => handleSort('highSeverityIssues')}
                      >
                        High Sev. <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th
                      className={cn(
                        'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-orange-600',
                        issuesGroupClass,
                      )}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={() => handleSort('mediumSeverityIssues')}
                      >
                        Med Sev. <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th
                      className={cn(
                        'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500',
                        issuesGroupClass,
                      )}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={() => handleSort('lowSeverityIssues')}
                      >
                        Low Sev. <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th
                      className={cn(
                        'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-indigo-600',
                        issuesGroupClass,
                      )}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={() => handleSort('specialMentionsCount')}
                      >
                        Special Mentions <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  </>
                ) : null}

                {visibleGroups.includes('csat_details')
                  ? csatColumnConfig.map((column) => (
                      <th
                        key={column.field}
                        className={cn(
                          'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600',
                          scorecardGroupClass,
                        )}
                      >
                        <button
                          type="button"
                          className="flex items-center gap-1 text-left leading-tight"
                          onClick={() => handleSort(toCsatSortKey(column.field))}
                        >
                          <span className="whitespace-nowrap">{column.label}</span>
                          <ArrowUpDown className="h-3 w-3 shrink-0" />
                        </button>
                      </th>
                    ))
                  : null}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((row) => (
                <tr key={row.id} className="group transition-colors hover:bg-slate-50/50">
                  <td className="sticky left-0 z-20 border-r border-slate-100 bg-white px-6 py-4 shadow-[6px_0_12px_-8px_rgba(15,23,42,0.4)] group-hover:bg-white">
                    <p className="text-sm font-bold text-slate-900">{row.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {viewBy === 'outlet' ? (
                        <>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            {row.city}
                          </span>
                          <span className="text-[10px] text-slate-400">{row.region}</span>
                        </>
                      ) : null}
                      {viewBy === 'city' ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          {row.region}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {visibleGroups.includes('basic') ? (
                    <>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{row.totalCalls}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'text-sm font-bold',
                            row.avgRatingScore >= 3.5
                              ? 'text-emerald-600'
                              : row.avgRatingScore >= 2.5
                                ? 'text-amber-600'
                                : 'text-red-600',
                          )}
                        >
                          {row.avgRatingScore.toFixed(1)}
                        </span>
                      </td>
                    </>
                  ) : null}

                  {visibleGroups.includes('ratings') ? (
                    <>
                      <td className={cn('px-4 py-4 text-sm font-medium text-emerald-600', ratingGroupClass)}>
                        {formatValue(row.excellentCount, row.totalCalls)}
                      </td>
                      <td className={cn('px-4 py-4 text-sm font-medium text-blue-600', ratingGroupClass)}>
                        {formatValue(row.goodCount, row.totalCalls)}
                      </td>
                      <td className={cn('px-4 py-4 text-sm font-medium text-amber-600', ratingGroupClass)}>
                        {formatValue(row.averageCount, row.totalCalls)}
                      </td>
                      <td className={cn('px-4 py-4 text-sm font-medium text-red-600', ratingGroupClass)}>
                        {formatValue(row.poorCount, row.totalCalls)}
                      </td>
                      <td className={cn('px-4 py-4 text-sm font-medium text-slate-400', ratingGroupClass)}>
                        {formatValue(row.naCount, row.totalCalls)}
                      </td>
                    </>
                  ) : null}

                  {visibleGroups.includes('issues') ? (
                    <>
                      <td className={cn('px-4 py-4 text-sm font-bold text-red-700', issuesGroupClass)}>
                        {row.highSeverityIssues}
                      </td>
                      <td className={cn('px-4 py-4 text-sm font-medium text-orange-600', issuesGroupClass)}>
                        {row.mediumSeverityIssues}
                      </td>
                      <td className={cn('px-4 py-4 text-sm font-medium text-slate-500', issuesGroupClass)}>
                        {row.lowSeverityIssues}
                      </td>
                      <td className={cn('px-4 py-4 text-sm font-bold text-indigo-600', issuesGroupClass)}>
                        {row.specialMentionsCount}
                      </td>
                    </>
                  ) : null}

                  {visibleGroups.includes('csat_details')
                    ? csatColumnConfig.map((column) => (
                        <td
                          key={`${row.id}-${column.field}`}
                          className={cn('px-4 py-4 text-xs font-semibold text-slate-700', scorecardGroupClass)}
                        >
                          {renderCsatMetric(row.csatDetails[column.field])}
                        </td>
                      ))
                    : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={currentPage} pageSize={pageSize} total={totalRecords} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};
