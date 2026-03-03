'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ComponentType } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  ChevronRight,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

import { useCategoryRecords } from '@/features/category-analysis/hooks/use-category-records';
import { exportCategoryRecords } from '@/features/category-analysis/services/category-analysis-client';
import {
  CATEGORY_SLUG_TO_NAME,
  createDefaultCategoryFilters,
  type CategoryPageFilterState,
} from '@/features/category-analysis/types';
import { EmptyState } from '@/shared/components/data-display/empty-state';
import { RatingBadge } from '@/shared/components/feedback/rating-badge';
import { FeedbackTableFilters } from '@/shared/components/filters/feedback-table-filters';
import { Pagination } from '@/shared/components/ui/pagination';
import { cn } from '@/shared/lib/cn';
import { downloadCsv } from '@/shared/lib/csv';
import { useOutletOptions } from '@/shared/hooks/use-outlet-options';
import type { FeedbackListItem, IssueCategory, Rating } from '@/shared/types/feedback';

interface CategoryAnalysisPageProps {
  categorySlug: string;
}

const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '');

const truncateWords = (text: string, maxWords: number) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }
  return `${words.slice(0, maxWords).join(' ')}...`;
};

const ratingWeight: Record<Rating, number> = {
  Excellent: 5,
  Good: 4,
  Average: 3,
  Poor: 2,
  'N/A': 1,
};

type CategorySortKey =
  | 'bookingId'
  | 'callDate'
  | 'outletName'
  | 'overallExperienceRating'
  | 'categoryIssueCount';

const getCategoryIssueCount = (item: FeedbackListItem, category: IssueCategory): number => {
  return item.issueTickets.filter((ticket) => ticket.category === category).length;
};

const sortCategoryItems = (
  items: FeedbackListItem[],
  category: IssueCategory,
  sortConfig: { key: CategorySortKey; direction: 'asc' | 'desc' },
): FeedbackListItem[] => {
  return [...items].sort((left, right) => {
    let comparison = 0;

    if (sortConfig.key === 'bookingId') {
      comparison = left.bookingId.localeCompare(right.bookingId);
    } else if (sortConfig.key === 'callDate') {
      comparison = new Date(left.callDate).getTime() - new Date(right.callDate).getTime();
    } else if (sortConfig.key === 'outletName') {
      comparison = left.outletName.localeCompare(right.outletName);
    } else if (sortConfig.key === 'overallExperienceRating') {
      comparison = ratingWeight[left.overallExperienceRating] - ratingWeight[right.overallExperienceRating];
    } else {
      comparison = getCategoryIssueCount(left, category) - getCategoryIssueCount(right, category);
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
};

export const CategoryAnalysisPage = ({ categorySlug }: CategoryAnalysisPageProps) => {
  const router = useRouter();
  const categoryName: IssueCategory = CATEGORY_SLUG_TO_NAME[categorySlug] ?? 'Food & Beverage';

  const [filters, setFilters] = useState<CategoryPageFilterState>(createDefaultCategoryFilters());
  const [sortConfig, setSortConfig] = useState<{ key: CategorySortKey; direction: 'asc' | 'desc' }>({
    key: 'callDate',
    direction: 'desc',
  });
  const [isExporting, setIsExporting] = useState(false);

  const categoryQuery = useCategoryRecords(categoryName, filters);
  const outletOptionsQuery = useOutletOptions();

  const stats = useMemo(() => {
    if (!categoryQuery.data) {
      return {
        callsWithIssues: 0,
        totalCategoryIssues: 0,
        highSeverityCategoryIssues: 0,
      };
    }

    const callsWithIssues = categoryQuery.data.total;
    const totalCategoryIssues = categoryQuery.data.items.reduce((accumulator, item) => {
      return (
        accumulator + item.issueTickets.filter((ticket) => ticket.category === categoryName).length
      );
    }, 0);

    const highSeverityCategoryIssues = categoryQuery.data.items.reduce((accumulator, item) => {
      return (
        accumulator +
        item.issueTickets.filter(
          (ticket) => ticket.category === categoryName && ticket.severity === 'High',
        ).length
      );
    }, 0);

    return {
      callsWithIssues,
      totalCategoryIssues,
      highSeverityCategoryIssues,
    };
  }, [categoryName, categoryQuery.data]);

  const openDetails = (feedbackId: string) => {
    router.push(`/feedback/${feedbackId}`);
  };

  const sortedItems = useMemo(() => {
    if (!categoryQuery.data) {
      return [];
    }

    return sortCategoryItems(categoryQuery.data.items, categoryName, sortConfig);
  }, [categoryName, categoryQuery.data, sortConfig]);

  const onSort = (key: CategorySortKey) => {
    setSortConfig((previous) => ({
      key,
      direction: previous.key === key && previous.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const onPageChange = (nextPage: number) => {
    setFilters((previous) => ({
      ...previous,
      page: nextPage,
    }));
  };

  const handleDownloadCsv = async () => {
    if (!categoryQuery.data || isExporting) {
      return;
    }

    const shouldDownloadAll =
      categoryQuery.data.totalPages <= 1 ||
      window.confirm(
        `This will download all ${categoryQuery.data.total.toLocaleString()} filtered records across ${categoryQuery.data.totalPages} pages. Continue?`,
      );

    if (!shouldDownloadAll) {
      return;
    }

    setIsExporting(true);

    try {
      const allRecords = await exportCategoryRecords(categoryName, filters);
      const sortedRecords = sortCategoryItems(allRecords, categoryName, sortConfig);

      downloadCsv(
        `${categorySlug}-analysis.csv`,
        [
          'Booking ID',
          'Call Date',
          'Outlet',
          'City',
          'Region',
          'Customer Experience',
          'Category Issue Count',
          'Category Issues',
          'Summary',
        ],
        sortedRecords.map((record) => [
          record.bookingId,
          new Date(record.callDate).toISOString(),
          record.outletName,
          record.city,
          record.region,
          record.overallExperienceRating,
          getCategoryIssueCount(record, categoryName),
          record.issueTickets
            .filter((ticket) => ticket.category === categoryName)
            .map((ticket) => `${ticket.subcategory} (${ticket.severity})`)
            .join(' | '),
          stripHtml(record.summary ?? ''),
        ]),
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mb-8 shrink-0">
        <div className="mb-6 flex flex-col gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Link href="/calls" className="transition-colors hover:text-orange-600">
                Feedback Calls
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-900">{categoryName}</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">{categoryName} Analysis</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Monitoring issues and performance for {categoryName.toLowerCase()}.
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <CategoryStatCard
            label="Total Calls with Issues"
            value={stats.callsWithIssues}
            icon={MessageSquare}
            trend="+12%"
            trendUp
          />
          <CategoryStatCard
            label="Total Issues Detected"
            value={stats.totalCategoryIssues}
            icon={AlertCircle}
            trend="+5%"
            trendUp={false}
          />
          <CategoryStatCard
            label="High Severity Issues"
            value={stats.highSeverityCategoryIssues}
            icon={TrendingUp}
            trend="-2%"
            trendUp
          />
        </div>

        <FeedbackTableFilters
          value={filters}
          onChange={setFilters}
          onDownloadCsv={handleDownloadCsv}
          isLoading={categoryQuery.isPending}
          isExporting={isExporting}
          searchPlaceholder="Search by booking ID or outlet..."
          outlets={outletOptionsQuery.data?.outlets}
          regions={outletOptionsQuery.data?.regions}
        />
      </header>

      {categoryQuery.isPending ? (
        <div className="h-[420px] animate-pulse rounded-2xl bg-slate-100" />
      ) : null}

      {categoryQuery.isError ? (
        <EmptyState
          title="Unable to load category analysis"
          description="Category data could not be fetched. Please retry and verify API availability."
        />
      ) : null}

      {categoryQuery.data && categoryQuery.data.items.length > 0 ? (
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[calc(100vh-480px)] overflow-auto">
            <table className="min-w-[1220px] w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="w-[150px] px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <button type="button" className="flex items-center gap-1.5" onClick={() => onSort('bookingId')}>
                      Booking ID
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-[150px] px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <button type="button" className="flex items-center gap-1.5" onClick={() => onSort('callDate')}>
                      Date & Time
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-[220px] px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <button type="button" className="flex items-center gap-1.5" onClick={() => onSort('outletName')}>
                      Outlet
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-[170px] px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <button
                      type="button"
                      className="flex items-center gap-1.5"
                      onClick={() => onSort('overallExperienceRating')}
                    >
                      Customer Experience
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-[340px] px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <button
                      type="button"
                      className="flex items-center gap-1.5"
                      onClick={() => onSort('categoryIssueCount')}
                    >
                      Category Issues
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Summary</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="group cursor-pointer transition-colors hover:bg-slate-50/50"
                    onClick={() => openDetails(item.id)}
                  >
                    <td className="px-6 py-6 align-top">
                      <p className="font-mono text-sm font-bold tracking-tight text-slate-900">{item.bookingId}</p>
                    </td>

                    <td className="px-6 py-6 align-top">
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(item.callDate).toLocaleDateString('en-IN')}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {new Date(item.callDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>

                    <td className="px-6 py-6 align-top">
                      <p className="text-sm font-bold text-slate-700">{item.outletName}</p>
                      <p className="text-[10px] text-slate-400">{item.region}</p>
                    </td>

                    <td className="px-6 py-6 align-top">
                      <RatingBadge rating={item.overallExperienceRating} />
                    </td>

                    <td className="px-6 py-6 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {item.issueTickets
                          .filter((ticket) => ticket.category === categoryName)
                          .slice(0, 5)
                          .map((ticket) => (
                            <div
                              key={ticket.id}
                              className={cn(
                                'flex flex-col gap-0.5 rounded border px-2 py-1 text-[9px] font-bold uppercase',
                                ticket.severity === 'High'
                                  ? 'border-red-100 bg-red-50 text-red-700'
                                  : ticket.severity === 'Medium'
                                    ? 'border-orange-100 bg-orange-50 text-orange-700'
                                    : 'border-slate-100 bg-slate-50 text-slate-600',
                              )}
                            >
                              <span>{ticket.subcategory}</span>
                              <span className="text-[7px] opacity-60">{ticket.severity} Severity</span>
                            </div>
                          ))}
                      </div>
                    </td>

                    <td className="px-6 py-6 align-top">
                      <p className="text-xs font-medium leading-relaxed text-slate-600">
                        {truncateWords(stripHtml(item.summary ?? 'No summary available'), 20)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={categoryQuery.data.page}
            pageSize={categoryQuery.data.pageSize}
            total={categoryQuery.data.total}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}

      {categoryQuery.data && categoryQuery.data.items.length === 0 ? (
        <EmptyState
          title="No category records match current search"
          description="Try a different booking ID or outlet keyword."
        />
      ) : null}
    </div>
  );
};

interface CategoryStatCardProps {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  trend: string;
  trendUp: boolean;
}

const CategoryStatCard = ({ label, value, icon: Icon, trend, trendUp }: CategoryStatCardProps) => {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-orange-50">
          <Icon className="h-6 w-6 text-slate-400 transition-colors group-hover:text-orange-600" />
        </div>
        <div
          className={cn(
            'flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black',
            trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
          )}
        >
          {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trend}
        </div>
      </div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
};
