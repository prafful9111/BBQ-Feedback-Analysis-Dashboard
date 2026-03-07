import type {
  CsatField,
  CsatScorecard,
  DashboardAlert,
  DashboardFilterOptions,
  DashboardOverview,
  FeedbackListItem,
  FeedbackListResponse,
  FeedbackRecord,
  IssueCategory,
  IssueSeverity,
  IssueTicket,
  IssueTicketSeverityCounts,
  PerformanceMatrixRow,
  Rating,
  TopOutlet,
} from '@/shared/types/feedback';

import { CSAT_FIELDS, ISSUE_CATEGORIES, RATINGS } from '@/shared/constants/feedback';
import { prisma } from '@/server/db/prisma-client';
import type { FeedbackRepository } from '@/server/repositories/feedback-repository';
import type { DashboardQuery, FeedbackListQuery } from '@/server/validation/feedback-query';
import { getOutletLocation } from '@/server/utils/outlet-mapping';
import type { feedback_analysis, issue_tickets } from '@prisma/client';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const ratingScoreMap: Record<string, number> = {
  Excellent: 4,
  Good: 3,
  Average: 2,
  Poor: 1,
  'N/A': 0,
};

const issueCategoryOrder: IssueCategory[] = [
  'Food & Beverage',
  'Ambience & Hygiene',
  'Booking & Billing',
  'Staff & Service',
];

const DEFAULT_CSAT: CsatScorecard = {
  ambience_hygiene_overall: 'N/A',
  ambience: 'N/A',
  hygiene: 'N/A',
  booking_and_billing: 'N/A',
  food_and_beverages_overall: 'N/A',
  beverages: 'N/A',
  buffet_main_course: 'N/A',
  starters_and_grills: 'N/A',
  kulfi: 'N/A',
  staff_and_service: 'N/A',
};

/** Map DB severity (UPPER / Title) → dashboard Title case */
function mapSeverity(severity: string | null | undefined): IssueSeverity {
  if (!severity) return 'Medium';
  const upper = severity.toUpperCase();
  if (upper === 'HIGH') return 'High';
  if (upper === 'LOW') return 'Low';
  return 'Medium';
}

/** Safely parse a CSAT scorecard from Json column (or stringified JSON) */
function parseCsatScorecard(raw: unknown): CsatScorecard {
  if (!raw) return { ...DEFAULT_CSAT };

  let obj: Record<string, string> = {};
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { ...DEFAULT_CSAT };
    }
  } else if (typeof raw === 'object' && raw !== null) {
    obj = raw as Record<string, string>;
  } else {
    return { ...DEFAULT_CSAT };
  }

  const result = { ...DEFAULT_CSAT };
  for (const field of CSAT_FIELDS) {
    const value = obj[field];
    if (value && ['Excellent', 'Good', 'Average', 'Poor', 'N/A'].includes(value)) {
      result[field] = value as Rating;
    }
  }
  return result;
}

/** Parse special_mentions – could be JSON array string or already parsed */
function parseSpecialMentions(raw: string | null | undefined): string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((item: unknown) => typeof item === 'string');
    return null;
  } catch {
    return null;
  }
}

/** Normalise overall experience rating */
function normaliseRating(raw: string | null | undefined): Rating {
  if (!raw) return 'N/A';
  const VALID: Rating[] = ['Excellent', 'Good', 'Average', 'Poor', 'N/A'];
  const found = VALID.find((v) => v.toLowerCase() === raw.toLowerCase());
  return found ?? 'N/A';
}

/** Safely parse JSON from string or return null */
function safeParseJson(raw: string | null | undefined): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

type DbFeedback = feedback_analysis & { issue_tickets: issue_tickets[] };

/** Map a DB row + its tickets to a FeedbackRecord */
function mapToFeedbackRecord(row: DbFeedback): FeedbackRecord {
  const { city, region } = getOutletLocation(row.outletName);

  const tickets: IssueTicket[] = row.issue_tickets
    .filter((t) => t.category && t.description)
    .map((t) => ({
      id: t.id,
      ticketType: (t.ticket_type === 'Suggestion' ? 'Suggestion' : 'Complaint') as IssueTicket['ticketType'],
      category: (t.category ?? 'Food & Beverage') as IssueCategory,
      subcategory: (t.subcategory ?? 'Overall') as IssueTicket['subcategory'],
      severity: mapSeverity(t.severity),
      description: t.description ?? '',
      assignedAttributes: safeParseJson(t.assigned_attributes),
    }));

  return {
    id: row.id,
    bookingId: row.bookingId ?? row.id,
    outletId: String(row.outletId ?? '0'),
    outletName: row.outletName ?? 'Unknown Outlet',
    city,
    region,
    callDate: (row.created_at ?? new Date()).toISOString(),
    overallExperienceRating: normaliseRating(row.overall_experience_rating),
    csatScorecard: parseCsatScorecard(row.csat_scorecard),
    summary: row.summary ?? null,
    translatedTranscript: row.transcript ?? null,
    specialMentions: parseSpecialMentions(row.special_mentions),
    issueTickets: tickets,
    recordingUrl: row.recordingURL ?? null,
    attributesUsage: safeParseJson(row.attributes_usage),
  };
}

function mapToListItem(record: FeedbackRecord): FeedbackListItem {
  return {
    ...record,
    issueCount: record.issueTickets.length,
    highSeverityCount: record.issueTickets.filter((t) => t.severity === 'High').length,
  };
}

const createSeverityAccumulator = (): IssueTicketSeverityCounts => ({
  all: 0,
  high: 0,
  medium: 0,
  low: 0,
});

const bumpSeverity = (accumulator: IssueTicketSeverityCounts, severity: 'High' | 'Medium' | 'Low') => {
  accumulator.all += 1;
  if (severity === 'High') accumulator.high += 1;
  else if (severity === 'Medium') accumulator.medium += 1;
  else accumulator.low += 1;
};

const createCsatAccumulator = (): Record<CsatField, { totalScore: number; callCount: number }> => {
  const accumulator = {} as Record<CsatField, { totalScore: number; callCount: number }>;
  for (const field of CSAT_FIELDS) {
    accumulator[field] = { totalScore: 0, callCount: 0 };
  }
  return accumulator;
};

interface OutletAccumulator extends Omit<PerformanceMatrixRow, 'avgRatingScore' | 'csatDetails'> {
  totalScore: number;
  csatDetails: Record<CsatField, { totalScore: number; callCount: number }>;
}

/* ------------------------------------------------------------------ */
/*  Repository                                                        */
/* ------------------------------------------------------------------ */

export class PrismaFeedbackRepository implements FeedbackRepository {
  /* ---- listFeedback ---- */

  async listFeedback(query: FeedbackListQuery): Promise<FeedbackListResponse> {
    const where = this.buildWhereClause(query);

    const [total, rows] = await Promise.all([
      prisma.feedback_analysis.count({ where }),
      prisma.feedback_analysis.findMany({
        where,
        include: { issue_tickets: true },
        orderBy: { created_at: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    let items = rows.map((row) => mapToListItem(mapToFeedbackRecord(row)));

    // Post-filter by city/region/manager which are derived fields
    if (query.region) {
      items = items.filter((item) => item.region === query.region);
    }

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  /* ---- getFeedbackById ---- */

  async getFeedbackById(feedbackId: string): Promise<FeedbackRecord | null> {
    const row = await prisma.feedback_analysis.findUnique({
      where: { id: feedbackId },
      include: { issue_tickets: true },
    });
    if (!row) return null;
    return mapToFeedbackRecord(row);
  }

  /* ---- getDashboardOverview ---- */

  async getDashboardOverview(query: DashboardQuery): Promise<DashboardOverview> {
    const where = this.buildDashboardWhereClause(query);

    const rows = await prisma.feedback_analysis.findMany({
      where,
      include: { issue_tickets: true },
    });

    const records = rows.map(mapToFeedbackRecord);

    // Apply derived field filters (region)
    const filtered = query.region
      ? records.filter((r) => r.region === query.region)
      : records;

    return this.computeDashboardOverview(filtered);
  }

  /* ---- Private: WHERE clause builders ---- */

  private buildWhereClause(query: FeedbackListQuery) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      overall_experience_rating: { not: null },
      outletName: { not: null },
    };

    if (query.outletId) {
      where.outletId = BigInt(query.outletId);
    }

    if (query.ratings.length > 0) {
      where.overall_experience_rating = { in: query.ratings };
    }

    if (query.dateFrom || query.dateTo) {
      where.created_at = {};
      if (query.dateFrom) where.created_at.gte = new Date(query.dateFrom);
      if (query.dateTo) where.created_at.lte = new Date(query.dateTo);
    }

    if (query.search) {
      const needle = query.search;
      where.OR = [
        { bookingId: { contains: needle, mode: 'insensitive' } },
        { outletName: { contains: needle, mode: 'insensitive' } },
        { summary: { contains: needle, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.issue_tickets = {
        some: { category: query.category },
      };
    }

    if (query.severity) {
      const dbSeverity = query.severity.toUpperCase();
      where.issue_tickets = {
        ...where.issue_tickets,
        some: {
          ...(where.issue_tickets?.some ?? {}),
          severity: dbSeverity,
        },
      };
    }

    return where;
  }

  private buildDashboardWhereClause(query: DashboardQuery) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      overall_experience_rating: { not: null },
      outletName: { not: null },
    };

    if (query.outletId) {
      where.outletId = BigInt(query.outletId);
    }

    if (query.ratings.length > 0) {
      where.overall_experience_rating = { in: query.ratings };
    }

    if (query.dateFrom || query.dateTo) {
      where.created_at = {};
      if (query.dateFrom) where.created_at.gte = new Date(query.dateFrom);
      if (query.dateTo) where.created_at.lte = new Date(query.dateTo);
    }

    return where;
  }

  /* ---- Private: Dashboard computation ---- */

  private computeDashboardOverview(records: FeedbackRecord[]): DashboardOverview {
    let totalCalls = 0;
    let totalScore = 0;
    let highSeverityIssues = 0;
    let mediumSeverityIssues = 0;
    let specialMentions = 0;

    const ratingDistributionMap = new Map<string, number>(RATINGS.map((r) => [r, 0]));
    const issueCategoryMap = new Map<string, number>(ISSUE_CATEGORIES.map((c) => [c, 0]));

    const categorySeverityMap: Record<IssueCategory, IssueTicketSeverityCounts> = {
      'Food & Beverage': createSeverityAccumulator(),
      'Ambience & Hygiene': createSeverityAccumulator(),
      'Booking & Billing': createSeverityAccumulator(),
      'Staff & Service': createSeverityAccumulator(),
    };
    const subcategorySeverityMap: Record<IssueCategory, Map<string, IssueTicketSeverityCounts>> = {
      'Food & Beverage': new Map(),
      'Ambience & Hygiene': new Map(),
      'Booking & Billing': new Map(),
      'Staff & Service': new Map(),
    };

    const outletAccumulator = new Map<string, OutletAccumulator>();
    const regionIssues = new Map<string, number>();
    const regionCalls = new Map<string, number>();
    const attributeSeverityMap = new Map<string, IssueTicketSeverityCounts>();

    for (const record of records) {
      totalCalls += 1;
      totalScore += ratingScoreMap[record.overallExperienceRating] ?? 0;
      specialMentions += record.specialMentions?.length ?? 0;

      ratingDistributionMap.set(
        record.overallExperienceRating,
        (ratingDistributionMap.get(record.overallExperienceRating) ?? 0) + 1,
      );

      regionCalls.set(record.region, (regionCalls.get(record.region) ?? 0) + 1);

      const existingOutlet = outletAccumulator.get(record.outletId);
      if (!existingOutlet) {
        outletAccumulator.set(record.outletId, {
          id: record.outletId,
          name: record.outletName,
          city: record.city,
          region: record.region,
          manager: 'N/A',
          totalCalls: 1,
          totalScore: ratingScoreMap[record.overallExperienceRating] ?? 0,
          excellentCount: record.overallExperienceRating === 'Excellent' ? 1 : 0,
          goodCount: record.overallExperienceRating === 'Good' ? 1 : 0,
          averageCount: record.overallExperienceRating === 'Average' ? 1 : 0,
          poorCount: record.overallExperienceRating === 'Poor' ? 1 : 0,
          naCount: record.overallExperienceRating === 'N/A' ? 1 : 0,
          specialMentionsCount: record.specialMentions?.length ?? 0,
          highSeverityIssues: 0,
          mediumSeverityIssues: 0,
          lowSeverityIssues: 0,
          categoryIssues: {
            'Food & Beverage': 0,
            'Ambience & Hygiene': 0,
            'Booking & Billing': 0,
            'Staff & Service': 0,
          },
          csatDetails: createCsatAccumulator(),
        });
      } else {
        existingOutlet.totalCalls += 1;
        existingOutlet.totalScore += ratingScoreMap[record.overallExperienceRating] ?? 0;
        existingOutlet.specialMentionsCount += record.specialMentions?.length ?? 0;

        if (record.overallExperienceRating === 'Excellent') existingOutlet.excellentCount += 1;
        else if (record.overallExperienceRating === 'Good') existingOutlet.goodCount += 1;
        else if (record.overallExperienceRating === 'Average') existingOutlet.averageCount += 1;
        else if (record.overallExperienceRating === 'Poor') existingOutlet.poorCount += 1;
        else existingOutlet.naCount += 1;
      }

      const outletRow = outletAccumulator.get(record.outletId);
      if (!outletRow) continue;

      for (const field of CSAT_FIELDS) {
        const csatRating = record.csatScorecard[field];
        if (csatRating === 'N/A') continue;
        outletRow.csatDetails[field].totalScore += ratingScoreMap[csatRating] ?? 0;
        outletRow.csatDetails[field].callCount += 1;
      }

      for (const issue of record.issueTickets) {
        if (!ISSUE_CATEGORIES.includes(issue.category as IssueCategory)) continue;

        issueCategoryMap.set(issue.category, (issueCategoryMap.get(issue.category) ?? 0) + 1);
        bumpSeverity(categorySeverityMap[issue.category as IssueCategory], issue.severity);

        const severityBySubcategory = subcategorySeverityMap[issue.category as IssueCategory];
        const existing = severityBySubcategory.get(issue.subcategory);
        if (existing) {
          bumpSeverity(existing, issue.severity);
        } else {
          const initial = createSeverityAccumulator();
          bumpSeverity(initial, issue.severity);
          severityBySubcategory.set(issue.subcategory, initial);
        }

        if (issue.severity === 'High') {
          highSeverityIssues += 1;
          outletRow.highSeverityIssues += 1;
        } else if (issue.severity === 'Medium') {
          mediumSeverityIssues += 1;
          outletRow.mediumSeverityIssues += 1;
        } else {
          outletRow.lowSeverityIssues += 1;
        }

        outletRow.categoryIssues[issue.category as IssueCategory] += 1;

        if (issue.assignedAttributes && typeof issue.assignedAttributes === 'object') {
          for (const [key, value] of Object.entries(issue.assignedAttributes)) {
            const label = `${key}: ${value}`;
            const existing = attributeSeverityMap.get(label);
            if (existing) {
              bumpSeverity(existing, issue.severity);
            } else {
              const initial = createSeverityAccumulator();
              bumpSeverity(initial, issue.severity);
              attributeSeverityMap.set(label, initial);
            }
          }
        }
      }

      const totalIssuesForCall = record.issueTickets.length;
      regionIssues.set(record.region, (regionIssues.get(record.region) ?? 0) + totalIssuesForCall);
    }

    const performanceMatrix: PerformanceMatrixRow[] = Array.from(outletAccumulator.values())
      .map((row) => ({
        ...row,
        avgRatingScore: row.totalCalls > 0 ? row.totalScore / row.totalCalls : 0,
        csatDetails: Object.fromEntries(
          CSAT_FIELDS.map((field) => {
            const metric = row.csatDetails[field];
            return [
              field,
              {
                rating: metric.callCount > 0 ? metric.totalScore / metric.callCount : 0,
                callCount: metric.callCount,
              },
            ];
          }),
        ) as PerformanceMatrixRow['csatDetails'],
      }))
      .sort((a, b) => b.avgRatingScore - a.avgRatingScore);

    const topOutlets: TopOutlet[] = performanceMatrix
      .map((row) => ({
        outletId: row.id,
        outletName: row.name,
        city: row.city,
        region: row.region,
        totalCalls: row.totalCalls,
        poorCount: row.poorCount,
        highSeverityIssues: row.highSeverityIssues,
        avgRatingScore: row.avgRatingScore,
      }))
      .sort((a, b) => {
        if (b.highSeverityIssues !== a.highSeverityIssues)
          return b.highSeverityIssues - a.highSeverityIssues;
        return a.avgRatingScore - b.avgRatingScore;
      })
      .slice(0, 12);

    const subcategoryDistribution = {
      'Food & Beverage': this.mapSeverityDistributionToTotals(subcategorySeverityMap['Food & Beverage']),
      'Ambience & Hygiene': this.mapSeverityDistributionToTotals(subcategorySeverityMap['Ambience & Hygiene']),
      'Booking & Billing': this.mapSeverityDistributionToTotals(subcategorySeverityMap['Booking & Billing']),
      'Staff & Service': this.mapSeverityDistributionToTotals(subcategorySeverityMap['Staff & Service']),
    };

    const issueTicketDistribution = {
      category: issueCategoryOrder.map((category) => ({
        label: category,
        counts: categorySeverityMap[category],
      })),
      subcategory: {
        'Food & Beverage': this.mapToSeverityDistribution(subcategorySeverityMap['Food & Beverage']),
        'Ambience & Hygiene': this.mapToSeverityDistribution(subcategorySeverityMap['Ambience & Hygiene']),
        'Booking & Billing': this.mapToSeverityDistribution(subcategorySeverityMap['Booking & Billing']),
        'Staff & Service': this.mapToSeverityDistribution(subcategorySeverityMap['Staff & Service']),
      },
      attribute: this.mapToSeverityDistribution(attributeSeverityMap),
    };

    const alerts = this.buildAlerts(performanceMatrix, regionIssues, regionCalls, totalCalls);

    // Build filter options from actual data
    const filterOptions = this.buildFilterOptions(records);

    return {
      kpis: {
        totalCalls,
        avgRatingScore: totalCalls > 0 ? Number((totalScore / totalCalls).toFixed(2)) : 0,
        highSeverityIssues,
        mediumSeverityIssues,
        specialMentions,
      },
      ratingDistribution: Array.from(ratingDistributionMap.entries()).map(([label, value]) => ({
        label,
        value,
      })),
      issueCategoryDistribution: Array.from(issueCategoryMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
      subcategoryDistribution,
      issueTicketDistribution,
      performanceMatrix,
      topOutlets,
      latestAlerts: alerts,
      filterOptions,
    };
  }

  /* ---- Private: Filter options from real data ---- */

  private buildFilterOptions(records: FeedbackRecord[]): DashboardFilterOptions {
    const regionSet = new Set<string>();
    const outletMap = new Map<string, { id: string; name: string; region: string; manager: string }>();

    for (const record of records) {
      regionSet.add(record.region);
      if (!outletMap.has(record.outletId)) {
        outletMap.set(record.outletId, {
          id: record.outletId,
          name: record.outletName,
          region: record.region,
          manager: 'N/A',
        });
      }
    }

    return {
      regions: Array.from(regionSet).sort(),
      managers: ['N/A'],
      outlets: Array.from(outletMap.values()),
    };
  }

  /* ---- Private: Alert builder ---- */

  private buildAlerts(
    rows: PerformanceMatrixRow[],
    regionIssues: Map<string, number>,
    regionCalls: Map<string, number>,
    totalCalls: number,
  ): DashboardAlert[] {
    if (totalCalls === 0) {
      return [
        {
          level: 'Info',
          message: 'No calls matched the selected filters.',
          timestamp: new Date().toISOString(),
        },
      ];
    }

    const alerts: DashboardAlert[] = [];
    const totalIssues = rows.reduce(
      (acc, row) => acc + row.highSeverityIssues + row.mediumSeverityIssues + row.lowSeverityIssues,
      0,
    );

    const avgIssuesPerOutlet = rows.length > 0 ? totalIssues / rows.length : 0;
    let offsetMinutes = 0;

    for (const row of rows) {
      const totalIssuesForOutlet = row.highSeverityIssues + row.mediumSeverityIssues + row.lowSeverityIssues;

      if (totalIssuesForOutlet > avgIssuesPerOutlet * 1.8) {
        alerts.push({
          level: 'Critical',
          message: `${row.name} is reporting ${totalIssuesForOutlet} issues, which is 80% above the network average.`,
          timestamp: new Date(Date.now() - offsetMinutes * 60_000).toISOString(),
        });
        offsetMinutes += 9;
      }

      if (row.poorCount > row.totalCalls * 0.25) {
        alerts.push({
          level: 'Warning',
          message: `${row.name} has a Poor rating frequency of ${((row.poorCount / row.totalCalls) * 100).toFixed(0)}%, exceeding the 15% threshold.`,
          timestamp: new Date(Date.now() - offsetMinutes * 60_000).toISOString(),
        });
        offsetMinutes += 9;
      }

      if (row.categoryIssues['Food & Beverage'] > row.totalCalls * 0.2) {
        alerts.push({
          level: 'Alert',
          message: `Food & Beverage complaints in ${row.name} are spiking (20%+ of calls).`,
          timestamp: new Date(Date.now() - offsetMinutes * 60_000).toISOString(),
        });
        offsetMinutes += 9;
      }

      if (alerts.length >= 5) break;
    }

    if (alerts.length < 5) {
      for (const [region, issueCount] of regionIssues.entries()) {
        const calls = regionCalls.get(region) ?? 0;
        if (calls === 0) continue;

        const density = issueCount / calls;
        if (density > 0.8) {
          alerts.push({
            level: 'Alert',
            message: `${region} Region is experiencing a high issue density (${density.toFixed(1)} issues/call).`,
            timestamp: new Date(Date.now() - offsetMinutes * 60_000).toISOString(),
          });
          offsetMinutes += 9;
        }

        if (alerts.length >= 5) break;
      }
    }

    if (alerts.length === 0) {
      return [
        {
          level: 'Info',
          message: 'No critical anomalies detected in the selected period.',
          timestamp: new Date().toISOString(),
        },
      ];
    }

    return alerts.slice(0, 5);
  }

  /* ---- Private: Distribution helpers ---- */

  private mapSeverityDistributionToTotals(map: Map<string, IssueTicketSeverityCounts>) {
    return Array.from(map.entries())
      .map(([label, counts]) => ({ label, value: counts.all }))
      .sort((a, b) => b.value - a.value);
  }

  private mapToSeverityDistribution(map: Map<string, IssueTicketSeverityCounts>) {
    return Array.from(map.entries())
      .map(([label, counts]) => ({ label, counts }))
      .sort((a, b) => b.counts.all - a.counts.all);
  }
}
