'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft, Calendar, Download, FileText, MapPin, Phone } from 'lucide-react';

import { useFeedbackDetail } from '@/features/feedback-management/hooks/use-feedback-detail';
import { EmptyState } from '@/shared/components/data-display/empty-state';
import { RatingBadge } from '@/shared/components/feedback/rating-badge';
import { CSAT_FIELDS } from '@/shared/constants/feedback';
import { cn } from '@/shared/lib/cn';
import { renderSentimentSummary } from '@/shared/lib/sentiment-summary';
import type { FeedbackRecord } from '@/shared/types/feedback';

interface FeedbackPdfPageProps {
  feedbackId: string;
}

interface TranscriptEntry {
  speaker: string;
  text: string;
  isAgent: boolean;
}

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

const toTitle = (value: string) =>
  value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const renderCsatRows = (feedback: FeedbackRecord) => {
  return CSAT_FIELDS.map((field) => ({
    field: toTitle(field),
    rating: feedback.csatScorecard[field],
  }));
};

export const FeedbackPdfPage = ({ feedbackId }: FeedbackPdfPageProps) => {
  const detailQuery = useFeedbackDetail(feedbackId, true);
  const feedback = detailQuery.data ?? null;

  const transcriptEntries = useMemo(() => {
    return parseTranscriptEntries(feedback?.translatedTranscript ?? null);
  }, [feedback?.translatedTranscript]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (detailQuery.isLoading) {
    return <div className="mx-auto max-w-5xl p-6"><div className="h-[70vh] animate-pulse rounded-2xl bg-slate-100" /></div>;
  }

  if (detailQuery.isError || !feedback) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <EmptyState
          title="Unable to load PDF view"
          description="Feedback record could not be loaded for PDF export."
        />
      </div>
    );
  }

  const csatRows = renderCsatRows(feedback);

  return (
    <div className="mx-auto max-w-5xl p-6 print:p-0">
      <style jsx global>{`
        @media print {
          .pdf-no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      <div className="pdf-no-print mb-4 flex items-center justify-between">
        <Link
          href={`/feedback/${feedback.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Feedback
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <header className="mb-8 border-b border-slate-200 pb-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            <FileText className="h-4 w-4" />
            Feedback Report
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{feedback.outletName}</h1>
          <p className="mt-1 font-mono text-xs text-slate-500">{feedback.bookingId}</p>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Call Date</p>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <Calendar className="h-4 w-4 text-slate-400" />
              {new Date(feedback.callDate).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <MapPin className="h-4 w-4 text-slate-400" />
              {feedback.city}, {feedback.region}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Call ID</p>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <Phone className="h-4 w-4 text-slate-400" />
              {feedback.id}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Experience</p>
            <div className="text-sm font-medium text-slate-700">
              <RatingBadge rating={feedback.overallExperienceRating} />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-700">AI Summary</h2>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-700">
            {feedback.summary ? renderSentimentSummary(feedback.summary) : 'No summary available.'}
          </div>
        </section>

        {feedback.attributesUsage && Object.keys(feedback.attributesUsage).length > 0 && (
          <section className="mb-8">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-700">Call Attributes</h2>
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
              {Object.entries(feedback.attributesUsage).map(([key, value]) => (
                <div key={key} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 capitalize">
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {feedback.specialMentions && feedback.specialMentions.length > 0 ? (
          <section className="mb-8">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-emerald-700">Special Mentions</h2>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
              <ul className="space-y-2">
                {feedback.specialMentions.map((mention, index) => (
                  <li key={`${mention}-${index}`} className="text-sm text-emerald-900">
                    • {mention}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {feedback.issueTickets.length > 0 ? (
          <section className="mb-8">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-red-700">
              Detected Issues ({feedback.issueTickets.length})
            </h2>
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
              {feedback.issueTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-red-200 bg-white px-4 py-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-500">{ticket.category}</p>
                    <span className="rounded border border-red-500 bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      {ticket.severity}
                    </span>
                  </div>
                  <p className="mb-1 text-sm font-semibold text-red-900">{ticket.subcategory}</p>
                  <p className="text-sm text-red-800">{ticket.description}</p>

                  {ticket.assignedAttributes && Object.keys(ticket.assignedAttributes).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(ticket.assignedAttributes).map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-full border border-red-100 bg-red-50/50 px-2 py-0.5 text-[10px] font-medium text-red-700"
                        >
                          {key}: {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mb-8">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-700">CSAT Scorecard</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Field
                  </th>
                  <th className="border-b border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {csatRows.map((row) => (
                  <tr key={row.field}>
                    <td className="border-b border-slate-100 px-4 py-2 text-slate-700">{row.field}</td>
                    <td className="border-b border-slate-100 px-4 py-2">
                      <span
                        className={cn(
                          'rounded border px-2 py-0.5 text-xs font-bold uppercase',
                          row.rating === 'Excellent'
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                            : row.rating === 'Good'
                              ? 'border-blue-100 bg-blue-50 text-blue-700'
                              : row.rating === 'Average'
                                ? 'border-amber-100 bg-amber-50 text-amber-700'
                                : row.rating === 'Poor'
                                  ? 'border-red-100 bg-red-50 text-red-700'
                                  : 'border-slate-100 bg-slate-50 text-slate-500',
                        )}
                      >
                        {row.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-700">Transcript</h2>
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            {transcriptEntries.length > 0 ? (
              transcriptEntries.map((entry, index) => (
                <div
                  key={`${entry.speaker}-${index}`}
                  className={cn(
                    'rounded border px-3 py-2 text-sm',
                    entry.isAgent ? 'border-orange-200 bg-orange-50' : 'border-sky-200 bg-sky-50',
                  )}
                >
                  <p
                    className={cn(
                      'mb-1 text-[10px] font-bold uppercase tracking-wider',
                      entry.isAgent ? 'text-orange-700' : 'text-sky-700',
                    )}
                  >
                    {entry.speaker}
                  </p>
                  <p className="leading-relaxed text-slate-800">{entry.text}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No transcript available.</p>
            )}
          </div>
        </section>
      </article>
    </div>
  );
};
