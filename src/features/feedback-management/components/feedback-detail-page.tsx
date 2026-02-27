'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  MapPin,
  Pause,
  Phone,
  Play,
} from 'lucide-react';

import { useFeedbackDetail } from '@/features/feedback-management/hooks/use-feedback-detail';
import { EmptyState } from '@/shared/components/data-display/empty-state';
import { RatingBadge } from '@/shared/components/feedback/rating-badge';
import { CSAT_FIELDS } from '@/shared/constants/feedback';
import { cn } from '@/shared/lib/cn';
import { downloadCsv } from '@/shared/lib/csv';
import { renderSentimentSummary } from '@/shared/lib/sentiment-summary';
import type { CsatScorecard, FeedbackRecord, Rating } from '@/shared/types/feedback';

interface FeedbackDetailPageProps {
  feedbackId: string;
}

interface TranscriptEntry {
  speaker: string;
  text: string;
  isAgent: boolean;
}

const scorecardGroups: Array<{
  label: string;
  parent: keyof CsatScorecard;
  subs: Array<keyof CsatScorecard>;
}> = [
  {
    label: 'Ambience & Hygiene',
    parent: 'ambience_hygiene_overall',
    subs: ['ambience', 'hygiene'],
  },
  {
    label: 'Food & Beverages',
    parent: 'food_and_beverages_overall',
    subs: ['beverages', 'buffet_main_course', 'starters_and_grills', 'kulfi'],
  },
  {
    label: 'Booking & Billing',
    parent: 'booking_and_billing',
    subs: [],
  },
  {
    label: 'Staff & Service',
    parent: 'staff_and_service',
    subs: [],
  },
];

const ratingIndicatorClasses: Record<Rating, string> = {
  Excellent: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  Good: 'text-blue-600 bg-blue-50 border-blue-100',
  Average: 'text-amber-600 bg-amber-50 border-amber-100',
  Poor: 'text-red-600 bg-red-50 border-red-100',
  'N/A': 'text-slate-400 bg-slate-50 border-slate-100',
};

const isAgentSpeaker = (speaker: string) => {
  const normalized = speaker.toLowerCase();
  return (
    normalized.includes('staff') ||
    normalized.includes('agent') ||
    normalized.includes('system') ||
    normalized.includes('other')
  );
};

const parseTranscriptEntries = (transcript: string | null): TranscriptEntry[] => {
  if (!transcript) {
    return [];
  }

  const lines = transcript
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const entries: TranscriptEntry[] = [];

  for (const line of lines) {
    const markdownMatch = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    if (markdownMatch) {
      const speaker = markdownMatch[1].trim();
      const text = markdownMatch[2].trim();
      if (text.length > 0) {
        entries.push({
          speaker,
          text,
          isAgent: isAgentSpeaker(speaker),
        });
      }
      continue;
    }

    const plainMatch = line.match(/^([^:]+):\s*(.*)$/);
    if (plainMatch) {
      const speaker = plainMatch[1].trim();
      const text = plainMatch[2].trim();
      if (text.length > 0) {
        entries.push({
          speaker,
          text,
          isAgent: isAgentSpeaker(speaker),
        });
      }
      continue;
    }

    const previous = entries[entries.length - 1];
    if (previous) {
      previous.text = `${previous.text} ${line}`;
    } else {
      entries.push({
        speaker: 'System',
        text: line,
        isAgent: true,
      });
    }
  }

  return entries;
};

const estimateDurationSeconds = (feedback: FeedbackRecord): number => {
  const transcript = feedback.translatedTranscript ?? '';
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  const estimated = Math.round(words * 0.55);
  return Math.max(75, Math.min(420, estimated));
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '');

const toTitle = (value: string) => {
  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const ScoreIndicator = ({ rating }: { rating: Rating }) => (
  <span
    className={cn(
      'rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest',
      ratingIndicatorClasses[rating],
    )}
  >
    {rating}
  </span>
);

export const FeedbackDetailPage = ({ feedbackId }: FeedbackDetailPageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const detailQuery = useFeedbackDetail(feedbackId, true);

  const feedback = detailQuery.data ?? null;

  const transcriptEntries = useMemo(() => {
    return parseTranscriptEntries(feedback?.translatedTranscript ?? null);
  }, [feedback?.translatedTranscript]);

  const handleDownloadCsv = () => {
    if (!feedback) {
      return;
    }

    const headers = [
      'Feedback ID',
      'Booking ID',
      'Outlet',
      'City',
      'Region',
      'Call Date',
      'Overall Experience',
      'Summary',
      'Transcript',
      'Special Mentions',
      ...CSAT_FIELDS.map((field) => `CSAT ${toTitle(field)}`),
      'Issue Ticket ID',
      'Issue Type',
      'Issue Category',
      'Issue Subcategory',
      'Issue Severity',
      'Issue Description',
    ];

    const baseRow: Array<string | number> = [
      feedback.id,
      feedback.bookingId,
      feedback.outletName,
      feedback.city,
      feedback.region,
      new Date(feedback.callDate).toISOString(),
      feedback.overallExperienceRating,
      stripHtml(feedback.summary ?? ''),
      feedback.translatedTranscript ?? '',
      feedback.specialMentions?.join(' | ') ?? '',
      ...CSAT_FIELDS.map((field) => feedback.csatScorecard[field]),
    ];

    const rows =
      feedback.issueTickets.length > 0
        ? feedback.issueTickets.map((ticket) => [
            ...baseRow,
            ticket.id,
            ticket.ticketType,
            ticket.category,
            ticket.subcategory,
            ticket.severity,
            ticket.description,
          ])
        : [[...baseRow, '', '', '', '', '', '']];

    downloadCsv(`feedback-detail-${feedback.bookingId}.csv`, headers, rows);
  };

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
              <Phone className="h-6 w-6 text-slate-600" />
            </div>

            <div>
              <Link
                href="/calls"
                className="mb-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-orange-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Calls
              </Link>

              <div className="mb-1 flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {feedback?.outletName ?? 'Loading feedback details...'}
                </h2>
                {feedback ? (
                  <span className="rounded border border-slate-100 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-500">
                    {feedback.bookingId}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-400">
                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  {feedback
                    ? new Date(feedback.callDate).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '--'}
                </p>

                <span className="h-1 w-1 rounded-full bg-slate-200" />

                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  {feedback ? formatDuration(estimateDurationSeconds(feedback)) : '--'}
                </p>

                <span className="h-1 w-1 rounded-full bg-slate-200" />

                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <MapPin className="h-3.5 w-3.5" />
                  {feedback ? `${feedback.region} Region` : '--'}
                </p>
              </div>
            </div>
          </div>

          {feedback ? (
            <div className="flex flex-col items-end">
              <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Customer Experience
              </span>
              <RatingBadge rating={feedback.overallExperienceRating} />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                  title="Download CSV"
                  aria-label="Download CSV"
                >
                  <Download className="h-4 w-4" />
                </button>
                <Link
                  href={`/feedback/${feedback.id}/pdf` as Route}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                  title="Open PDF View"
                  aria-label="Open PDF view"
                >
                  <FileText className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {detailQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div className="space-y-4 lg:col-span-4">
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      ) : null}

      {detailQuery.isError ? (
        <EmptyState
          title="Unable to load feedback detail"
          description="The selected feedback record could not be fetched. Please retry."
        />
      ) : null}

      {!detailQuery.isLoading && !detailQuery.isError && feedback ? (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {feedback.issueTickets.length > 0 ? (
              <section className="rounded-3xl border border-red-200 bg-red-50 p-8 ring-1 ring-red-100">
                <h3 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-700">
                  Detected Issues ({feedback.issueTickets.length})
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {feedback.issueTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="group flex items-start gap-5 rounded-2xl border border-red-200 bg-white/80 p-5 transition-all hover:border-red-300 hover:bg-white"
                    >
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-transform group-hover:scale-105',
                          ticket.severity === 'High'
                            ? 'border-red-200 bg-red-100 text-red-600'
                            : 'border-rose-200 bg-rose-100 text-rose-600',
                        )}
                      >
                        <AlertCircle className="h-6 w-6" />
                      </div>

                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                            {ticket.category}
                          </p>
                          <span
                            className={cn(
                              'rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter',
                              ticket.severity === 'High'
                                ? 'border-red-600 bg-red-600 text-white'
                                : 'border-rose-500 bg-rose-500 text-white',
                            )}
                          >
                            {ticket.severity} Severity
                          </span>
                        </div>
                        <p className="mb-1 text-sm font-bold text-red-900">{ticket.subcategory}</p>
                        <p className="text-xs leading-relaxed text-red-800">{ticket.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="relative overflow-hidden rounded-3xl border border-orange-100/50 bg-orange-50/30 p-8 shadow-sm">
              <div className="absolute right-0 top-0 p-4 opacity-[0.03]">
                <FileText className="h-24 w-24 text-orange-900" />
              </div>
              <h3 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
                AI Summary
              </h3>
              <div className="relative">
                <div className="absolute -left-4 bottom-0 top-0 w-1 rounded-full bg-orange-200" />
                <p className="pl-4 text-lg font-medium italic leading-relaxed text-slate-700">
                  {feedback.summary ? renderSentimentSummary(feedback.summary) : 'No summary available.'}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Call Transcript
              </h3>

              <div className="max-h-[460px] space-y-4 overflow-y-auto pr-4">
                {transcriptEntries.length > 0 ? (
                  transcriptEntries.map((entry, index) => (
                    <div
                      key={`${entry.speaker}-${index}`}
                      className={cn('flex gap-4', entry.isAgent ? 'justify-start' : 'justify-end')}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-xl border p-4 text-sm leading-relaxed',
                          entry.isAgent
                            ? 'border-orange-200 bg-orange-50 text-orange-900'
                            : 'border-sky-200 bg-sky-50 text-sky-900',
                        )}
                      >
                        <p
                          className={cn(
                            'mb-1 text-[10px] font-bold uppercase tracking-wider',
                            entry.isAgent ? 'text-orange-600/80' : 'text-sky-700/80',
                          )}
                        >
                          {entry.speaker}
                        </p>
                        {entry.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No transcript available.</p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8 lg:col-span-4">
            {feedback.specialMentions && feedback.specialMentions.length > 0 ? (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 ring-1 ring-emerald-100">
                <h3 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Special Mentions
                </h3>
                <div className="space-y-3">
                  {feedback.specialMentions.map((mention, index) => (
                    <div key={`${mention}-${index}`} className="flex items-start gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <p className="text-xs leading-relaxed text-emerald-800">{mention}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-100 bg-white p-6">
              <h3 className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                CSAT Scorecard
              </h3>

              <div className="space-y-8">
                {scorecardGroups.map((group) => {
                  const parentRating = feedback.csatScorecard[group.parent];
                  const activeSubs = group.subs.filter((sub) => feedback.csatScorecard[sub] !== 'N/A');

                  if (parentRating === 'N/A' && activeSubs.length === 0) {
                    return null;
                  }

                  return (
                    <div key={group.label} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-tight text-slate-800">
                          {group.label}
                        </p>
                        {parentRating !== 'N/A' ? <RatingBadge rating={parentRating} /> : null}
                      </div>

                      {activeSubs.length > 0 ? (
                        <div className="space-y-3 border-l border-slate-100 pl-4">
                          {activeSubs.map((sub) => (
                            <div key={sub} className="flex items-center justify-between">
                              <span className="text-xs font-medium capitalize text-slate-500">
                                {sub.replaceAll('_', ' ')}
                              </span>
                              <ScoreIndicator rating={feedback.csatScorecard[sub]} />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setIsPlaying((previous) => !previous)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white transition-all hover:bg-slate-600"
                  aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Call Recording
                    </p>
                    <p className="font-mono text-[10px] font-bold text-slate-500">01:24 / 03:45</p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[35%] rounded-full bg-slate-500" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
};
