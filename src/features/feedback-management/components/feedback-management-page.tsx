'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Download } from 'lucide-react';

import { FeedbackFilters } from '@/features/feedback-management/components/feedback-filters';
import { FeedbackTable } from '@/features/feedback-management/components/feedback-table';
import { useFeedbackList } from '@/features/feedback-management/hooks/use-feedback-list';
import { exportFeedbackList } from '@/features/feedback-management/services/feedback-client';
import {
  createDefaultFeedbackFilters,
  type FeedbackFilterState,
} from '@/features/feedback-management/types';
import { EmptyState } from '@/shared/components/data-display/empty-state';
import { downloadCsv } from '@/shared/lib/csv';

export const FeedbackManagementPage = () => {
  const router = useRouter();
  const [filters, setFilters] = useState<FeedbackFilterState>(createDefaultFeedbackFilters());
  const [isExporting, setIsExporting] = useState(false);

  const listQuery = useFeedbackList(filters);

  const onPageChange = (nextPage: number) => {
    setFilters((previous) => ({
      ...previous,
      page: nextPage,
    }));
  };

  const openFeedbackDetail = useCallback(
    (feedbackId: string) => {
      router.push(`/feedback/${feedbackId}`);
    },
    [router],
  );

  const handleDownloadCsv = async () => {
    if (!listQuery.data || isExporting) {
      return;
    }

    const shouldDownloadAll =
      listQuery.data.totalPages <= 1 ||
      window.confirm(
        `This will download all ${listQuery.data.total.toLocaleString()} filtered records across ${listQuery.data.totalPages} pages. Continue?`,
      );

    if (!shouldDownloadAll) {
      return;
    }

    setIsExporting(true);

    try {
      const allRecords = await exportFeedbackList(filters);

      downloadCsv(
        'feedback-management.csv',
        [
          'Booking ID',
          'Call Date',
          'Outlet',
          'City',
          'Region',
          'Overall Experience',
          'Issue Count',
          'High Severity Count',
          'Summary',
        ],
        allRecords.map((record) => [
          record.bookingId,
          record.callDate,
          record.outletName,
          record.city,
          record.region,
          record.overallExperienceRating,
          record.issueCount,
          record.highSeverityCount,
          record.summary ?? '',
        ]),
      );
    } finally {
      setIsExporting(false);
    }
  };

  const content = useMemo(() => {
    if (listQuery.isPending) {
      return <div className="h-80 animate-pulse rounded-lg bg-muted" />;
    }

    if (listQuery.isError || !listQuery.data) {
      return (
        <EmptyState
          title="Unable to load feedback list"
          description="Feedback API is unavailable. Check API routes and retry."
        />
      );
    }

    return (
      <FeedbackTable data={listQuery.data} onRowClick={openFeedbackDetail} onPageChange={onPageChange} />
    );
  }, [listQuery.data, listQuery.isError, listQuery.isPending, openFeedbackDetail]);

  return (
    <div className="space-y-6">
      <FeedbackFilters
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(createDefaultFeedbackFilters())}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={isExporting || listQuery.isPending}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Preparing CSV...' : 'Download CSV'}
        </button>
      </div>

      {content}
    </div>
  );
};
