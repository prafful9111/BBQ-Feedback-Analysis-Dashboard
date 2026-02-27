'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

import { useCallsPageRecords } from '@/features/call-logs/hooks/use-calls-page-records';
import { exportCallsRecords } from '@/features/call-logs/services/call-logs-client';
import {
  createDefaultCallsFilters,
  type CallsPageFilterState,
} from '@/features/call-logs/types';
import { EmptyState } from '@/shared/components/data-display/empty-state';
import { RatingBadge } from '@/shared/components/feedback/rating-badge';
import { FeedbackTableFilters } from '@/shared/components/filters/feedback-table-filters';
import { Pagination } from '@/shared/components/ui/pagination';
import { cn } from '@/shared/lib/cn';
import { downloadCsv } from '@/shared/lib/csv';
import type { FeedbackListItem, Rating } from '@/shared/types/feedback';

const ratingWeight: Record<Rating, number> = {
  Excellent: 5,
  Good: 4,
  Average: 3,
  Poor: 2,
  'N/A': 1,
};

type CallsSortKey =
  | 'bookingId'
  | 'callDate'
  | 'outletName'
  | 'overallExperienceRating'
  | 'issueCount'
  | 'specialMentionsCount';

const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '');

const truncateWords = (text: string, maxWords: number) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }
  return `${words.slice(0, maxWords).join(' ')}...`;
};

const sortCalls = (
  items: FeedbackListItem[],
  sortConfig: { key: CallsSortKey; direction: 'asc' | 'desc' },
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
    } else if (sortConfig.key === 'issueCount') {
      comparison = left.issueTickets.length - right.issueTickets.length;
    } else {
      comparison = (left.specialMentions?.length ?? 0) - (right.specialMentions?.length ?? 0);
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
};

export const CallsPage = () => {
  const router = useRouter();
  const [filters, setFilters] = useState<CallsPageFilterState>(createDefaultCallsFilters());
  const [sortConfig, setSortConfig] = useState<{ key: CallsSortKey; direction: 'asc' | 'desc' }>({
    key: 'callDate',
    direction: 'desc',
  });
  const [isExporting, setIsExporting] = useState(false);

  const callsQuery = useCallsPageRecords(filters);

  const openDetails = (feedbackId: string) => {
    router.push(`/feedback/${feedbackId}`);
  };

  const sortedItems = useMemo(() => {
    if (!callsQuery.data) {
      return [];
    }

    return sortCalls(callsQuery.data.items, sortConfig);
  }, [callsQuery.data, sortConfig]);

  const onSort = (key: CallsSortKey) => {
    setSortConfig((previous) => ({
      key,
      direction: previous.key === key && previous.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleDownloadCsv = async () => {
    if (!callsQuery.data || isExporting) {
      return;
    }

    const shouldDownloadAll =
      callsQuery.data.totalPages <= 1 ||
      window.confirm(
        `This will download all ${callsQuery.data.total.toLocaleString()} filtered records across ${callsQuery.data.totalPages} pages. Continue?`,
      );

    if (!shouldDownloadAll) {
      return;
    }

    setIsExporting(true);

    try {
      const allRecords = await exportCallsRecords(filters);
      const sortedRecords = sortCalls(allRecords, sortConfig);

      downloadCsv(
        'feedback-calls.csv',
        [
          'Booking ID',
          'Call Date',
          'Outlet',
          'City',
          'Region',
          'Customer Experience',
          'Issue Count',
          'Issue Tickets',
          'Special Mentions',
          'Summary',
        ],
        sortedRecords.map((record) => [
          record.bookingId,
          new Date(record.callDate).toISOString(),
          record.outletName,
          record.city,
          record.region,
          record.overallExperienceRating,
          record.issueTickets.length,
          record.issueTickets
            .map((ticket) => `${ticket.category} > ${ticket.subcategory} (${ticket.severity})`)
            .join(' | '),
          record.specialMentions?.join(' | ') ?? '',
          stripHtml(record.summary ?? ''),
        ]),
      );
    } finally {
      setIsExporting(false);
    }
  };

  const onPageChange = (nextPage: number) => {
    setFilters((previous) => ({
      ...previous,
      page: nextPage,
    }));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mb-8 shrink-0">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Feedback Call Logs</h2>
          <p className="text-sm font-medium text-slate-500">
            Detailed analysis of individual customer conversations
          </p>
        </div>

        <FeedbackTableFilters
          value={filters}
          onChange={setFilters}
          onDownloadCsv={handleDownloadCsv}
          isLoading={callsQuery.isPending}
          isExporting={isExporting}
          searchPlaceholder="Search outlets or summaries..."
        />
      </header>

      {callsQuery.isPending ? (
        <div className="h-[420px] animate-pulse rounded-2xl bg-slate-100" />
      ) : null}

      {callsQuery.isError ? (
        <EmptyState
          title="Unable to load calls"
          description="Call records could not be fetched. Please retry and check API connectivity."
        />
      ) : null}

      {callsQuery.data && callsQuery.data.items.length > 0 ? (
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-full overflow-x-auto">
            <table className="min-w-[1520px] w-full border-collapse text-left">
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
                  <th className="w-[210px] px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <button type="button" className="flex items-center gap-1.5" onClick={() => onSort('outletName')}>
                      Outlet
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-[150px] px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <button
                      type="button"
                      className="flex items-center gap-1.5"
                      onClick={() => onSort('overallExperienceRating')}
                    >
                      Customer Experience
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-[340px] px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Summary</th>
                  <th className="w-[220px] px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <button type="button" className="flex items-center gap-1.5" onClick={() => onSort('issueCount')}>
                      Issue Tickets
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-[220px] px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <button
                      type="button"
                      className="flex items-center gap-1.5"
                      onClick={() => onSort('specialMentionsCount')}
                    >
                      Special Mentions
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Scorecard</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedItems.map((call) => (
                  <tr
                    key={call.id}
                    className="group cursor-pointer transition-colors hover:bg-slate-50/50"
                    onClick={() => openDetails(call.id)}
                  >
                    <td className="px-6 py-6 align-top">
                      <p className="font-mono text-sm font-bold tracking-tight text-slate-900">{call.bookingId}</p>
                    </td>

                    <td className="px-6 py-6 align-top">
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(call.callDate).toLocaleDateString('en-IN')}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {new Date(call.callDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>

                    <td className="px-6 py-6 align-top">
                      <p className="text-sm font-bold text-slate-700">{call.outletName}</p>
                      <p className="text-[10px] text-slate-400">{call.region}</p>
                    </td>

                    <td className="px-6 py-6 align-top">
                      <RatingBadge rating={call.overallExperienceRating} />
                    </td>

                    <td className="px-6 py-6 align-top">
                      <p className="max-w-[330px] text-xs leading-relaxed text-slate-600">
                        {truncateWords(stripHtml(call.summary ?? 'No summary available'), 22)}
                      </p>
                    </td>

                    <td className="px-6 py-6 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {call.issueTickets.length > 0 ? (
                          call.issueTickets.slice(0, 4).map((ticket) => (
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
                          ))
                        ) : (
                          <span className="text-[10px] italic text-slate-300">None</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-6 align-top">
                      <div className="space-y-1.5">
                        {call.specialMentions && call.specialMentions.length > 0 ? (
                          call.specialMentions.slice(0, 2).map((mention, index) => (
                            <div key={`${mention}-${index}`} className="flex items-start gap-2">
                              <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                              <p className="text-[10px] font-medium leading-tight text-indigo-600">{mention}</p>
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] italic text-slate-300">None</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-6 align-top">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(call.csatScorecard)
                          .filter(([, rating]) => rating !== 'N/A')
                          .slice(0, 6)
                          .map(([key, rating]) => (
                            <div
                              key={key}
                              className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2 py-1"
                            >
                              <span className="whitespace-nowrap text-[8px] font-bold uppercase text-slate-500">
                                {key.split('_')[0]}
                              </span>
                              <div
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  rating === 'Excellent'
                                    ? 'bg-emerald-500'
                                    : rating === 'Good'
                                      ? 'bg-blue-500'
                                      : rating === 'Average'
                                        ? 'bg-amber-500'
                                        : 'bg-red-500',
                                )}
                              />
                            </div>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={callsQuery.data.page}
            pageSize={callsQuery.data.pageSize}
            total={callsQuery.data.total}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}

      {callsQuery.data && callsQuery.data.items.length === 0 ? (
        <EmptyState
          title="No call records match current filters"
          description="Adjust search, region, outlet, or rating filters to see matching calls."
        />
      ) : null}
    </div>
  );
};
