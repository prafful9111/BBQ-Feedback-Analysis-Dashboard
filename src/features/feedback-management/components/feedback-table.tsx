'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Card } from '@/shared/components/ui/card';
import { Pagination } from '@/shared/components/ui/pagination';
import { EmptyState } from '@/shared/components/data-display/empty-state';
import { RatingBadge } from '@/shared/components/feedback/rating-badge';
import { formatDate } from '@/shared/lib/format';
import type { FeedbackListItem, FeedbackListResponse, Rating } from '@/shared/types/feedback';

interface FeedbackTableProps {
  data: FeedbackListResponse;
  onRowClick: (feedbackId: string) => void;
  onPageChange: (nextPage: number) => void;
}

type FeedbackSortKey =
  | 'bookingId'
  | 'outletName'
  | 'callDate'
  | 'overallExperienceRating'
  | 'issueCount'
  | 'highSeverityCount';

const ratingWeight: Record<Rating, number> = {
  Excellent: 5,
  Good: 4,
  Average: 3,
  Poor: 2,
  'N/A': 1,
};

const sortFeedbackRows = (
  rows: FeedbackListItem[],
  sortConfig: { key: FeedbackSortKey; direction: 'asc' | 'desc' },
) => {
  return [...rows].sort((left, right) => {
    let comparison = 0;

    if (sortConfig.key === 'bookingId') {
      comparison = left.bookingId.localeCompare(right.bookingId);
    } else if (sortConfig.key === 'outletName') {
      comparison = left.outletName.localeCompare(right.outletName);
    } else if (sortConfig.key === 'callDate') {
      comparison = new Date(left.callDate).getTime() - new Date(right.callDate).getTime();
    } else if (sortConfig.key === 'overallExperienceRating') {
      comparison = ratingWeight[left.overallExperienceRating] - ratingWeight[right.overallExperienceRating];
    } else if (sortConfig.key === 'issueCount') {
      comparison = left.issueCount - right.issueCount;
    } else {
      comparison = left.highSeverityCount - right.highSeverityCount;
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
};

export const FeedbackTable = ({ data, onRowClick, onPageChange }: FeedbackTableProps) => {
  const [sortConfig, setSortConfig] = useState<{ key: FeedbackSortKey; direction: 'asc' | 'desc' }>({
    key: 'callDate',
    direction: 'desc',
  });

  const sortedRows = useMemo(() => {
    return sortFeedbackRows(data.items, sortConfig);
  }, [data.items, sortConfig]);

  const onSort = (key: FeedbackSortKey) => {
    setSortConfig((previous) => ({
      key,
      direction: previous.key === key && previous.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  if (data.items.length === 0) {
    return (
      <EmptyState
        title="No records found"
        description="Try changing filters, date range, or search criteria to view feedback records."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <button type="button" className="inline-flex items-center gap-1.5" onClick={() => onSort('bookingId')}>
                Booking ID
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead>
              <button type="button" className="inline-flex items-center gap-1.5" onClick={() => onSort('outletName')}>
                Outlet
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead>
              <button type="button" className="inline-flex items-center gap-1.5" onClick={() => onSort('callDate')}>
                Date
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                className="inline-flex items-center gap-1.5"
                onClick={() => onSort('overallExperienceRating')}
              >
                Rating
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button type="button" className="inline-flex items-center gap-1.5" onClick={() => onSort('issueCount')}>
                Issues
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                type="button"
                className="inline-flex items-center gap-1.5"
                onClick={() => onSort('highSeverityCount')}
              >
                High Severity
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((item) => (
            <TableRow key={item.id} className="cursor-pointer" onClick={() => onRowClick(item.id)}>
              <TableCell className="font-medium">{item.bookingId}</TableCell>
              <TableCell>
                <p>{item.outletName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.city}, {item.region}
                </p>
              </TableCell>
              <TableCell>{formatDate(item.callDate)}</TableCell>
              <TableCell>
                <RatingBadge rating={item.overallExperienceRating} />
              </TableCell>
              <TableCell className="text-right">{item.issueCount}</TableCell>
              <TableCell className="text-right">{item.highSeverityCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={onPageChange}
      />
    </Card>
  );
};
